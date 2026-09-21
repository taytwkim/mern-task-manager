const test = require('node:test');
const assert = require('node:assert/strict');
const Task = require('../models/Task');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/tasks');
const errorHandler = require('../middleware/errorHandler');

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send() { return this; },
  };
}

async function callHandler(handler, body, id) {
  const res = response();
  await handler({ body, params: { id } }, res);
  return res;
}

// Mock model methods so these tests never access the real Atlas database.
test('create and list tasks preserve the API response shape', async (t) => {
  const doc = new Task({ title: 'Learn MongoDB' });
  t.mock.method(Task, 'create', async (data) => {
    assert.deepEqual(data, { title: 'Learn MongoDB', completed: false });
    return doc;
  });
  t.mock.method(Task, 'find', async () => [doc]);
  const created = await callHandler(createTask, { title: '  Learn MongoDB  ', id: 'ignored' });
  assert.equal(created.statusCode, 201);
  assert.deepEqual(created.body, { id: doc._id.toString(), title: 'Learn MongoDB', completed: false });
  assert.deepEqual((await callHandler(getTasks)).body, [created.body]);
});

test('invalid input is rejected before database writes', async (t) => {
  const create = t.mock.method(Task, 'create', async () => assert.fail('Unexpected write'));
  const update = t.mock.method(Task, 'findByIdAndUpdate', async () => assert.fail('Unexpected write'));
  const id = new Task()._id.toString();
  for (const body of [undefined, null, {}, { title: '' }, { title: ' ' }, { title: 42 }]) {
    assert.equal((await callHandler(createTask, body)).statusCode, 400);
  }
  for (const body of [undefined, {}, { title: null }, { title: ' ' }, { completed: 'true' }, { title: 'Valid', completed: 1 }]) {
    assert.equal((await callHandler(updateTask, body, id)).statusCode, 400);
  }
  assert.equal(create.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
});

test('partial updates allow false and only write supplied permitted fields', async (t) => {
  const doc = new Task({ title: 'Original', completed: true });
  const id = doc._id.toString();
  const update = t.mock.method(Task, 'findByIdAndUpdate', async (actualId, changes, options) => {
    assert.equal(actualId, id);
    assert.equal(options.runValidators, true);
    assert.equal(options.returnDocument, 'after');
    return new Task({ _id: doc._id, title: doc.title, completed: doc.completed, ...changes.$set });
  });
  const result = await callHandler(updateTask, { completed: false, _id: 'ignored', extra: 1 }, id);
  assert.deepEqual(update.mock.calls[0].arguments[1], { $set: { completed: false } });
  assert.deepEqual(result.body, { id, title: 'Original', completed: false });
  const renamed = await callHandler(updateTask, { title: '  Renamed  ' }, id);
  assert.deepEqual(update.mock.calls[1].arguments[1], { $set: { title: 'Renamed' } });
  assert.equal(renamed.body.title, 'Renamed');
  assert.equal(renamed.body.completed, true);
});

test('malformed IDs are 400, missing documents are 404, and deletion is 204', async (t) => {
  t.mock.method(Task, 'findByIdAndUpdate', async () => null);
  const doc = new Task({ title: 'Delete me' });
  t.mock.method(Task, 'findByIdAndDelete', async (id) => id === doc._id.toString() ? doc : null);
  for (const handler of [updateTask, deleteTask]) {
    assert.equal((await callHandler(handler, { title: 'Task' }, 'bad-id')).statusCode, 400);
    assert.equal((await callHandler(handler, { title: 'Task' }, new Task()._id.toString())).statusCode, 404);
  }
  const deleted = await callHandler(deleteTask, undefined, doc._id.toString());
  assert.equal(deleted.statusCode, 204);
  assert.equal(deleted.body, undefined);
});

test('database errors propagate and the error handler returns safe JSON', async (t) => {
  const failure = new Error('Private database details');
  for (const method of ['find', 'create', 'findByIdAndUpdate', 'findByIdAndDelete']) {
    t.mock.method(Task, method, async () => { throw failure; });
  }
  for (const handler of [getTasks, createTask, updateTask, deleteTask]) {
    await assert.rejects(callHandler(handler, { title: 'Task' }, new Task()._id.toString()), failure);
  }
  const res = response();
  errorHandler(failure, {}, res, () => {});
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'Unable to complete the request' });
  errorHandler({ type: 'entity.parse.failed' }, {}, res, () => {});
  assert.equal(res.statusCode, 400);
  errorHandler({ name: 'ValidationError' }, {}, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('Task schema trims titles, defaults completed, and rejects empty titles', async () => {
  const doc = new Task({ title: '  Test  ' });
  await doc.validate();
  assert.equal(doc.title, 'Test');
  assert.equal(doc.completed, false);
  for (const title of [undefined, '', '   ']) {
    await assert.rejects(new Task({ title }).validate(), { name: 'ValidationError' });
  }
});
