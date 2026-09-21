import test from 'node:test'
import assert from 'node:assert/strict'
import { requestTasks } from '../src/api.js'

test('sends JSON requests and returns the server result', async (t) => {
  const task = { id: '123', title: 'Learn React', completed: false }
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/tasks')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), { title: 'Learn React' })
    return Response.json(task, { status: 201 })
  })
  assert.deepEqual(await requestTasks('', {
    method: 'POST', body: JSON.stringify({ title: 'Learn React' }),
  }), task)
})

test('DELETE accepts an empty 204 response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }))
  assert.equal(await requestTasks('/123', { method: 'DELETE' }), null)
})

test('HTTP and network errors produce useful messages', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ message: 'Task not found' }, { status: 404 }))
  await assert.rejects(requestTasks('/123'), /Task not found/)
  fetchMock.mock.mockImplementation(async () => new Response('', { status: 502 }))
  await assert.rejects(requestTasks(), /Request failed \(502\)/)
  fetchMock.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(requestTasks(), /Could not reach the server/)
})
