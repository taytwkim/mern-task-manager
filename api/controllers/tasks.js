const mongoose = require('mongoose');
const Task = require('../models/Task');

// Keep the existing API shape while MongoDB stores the identifier as _id.
function toTaskResponse(task) {
  return { id: task._id.toString(), title: task.title, completed: task.completed };
}

function isValidTitle(title) {
  return typeof title === 'string' && title.trim().length > 0;
}

async function getTasks(req, res) {
  // await waits for MongoDB's result without blocking other requests.
  const tasks = await Task.find();
  res.json(tasks.map(toTaskResponse));
}

async function createTask(req, res) {
  // Optional chaining (?.) safely handles requests with no JSON body.
  const title = req.body?.title;

  if (!isValidTitle(title)) {
    return res.status(400).json({ message: 'Title must be a non-empty string' });
  }

  // create validates the model and saves the document to MongoDB.
  const task = await Task.create({
    title: title.trim(),
    completed: false,
  });
  
  res.status(201).json(toTaskResponse(task));
}

async function updateTask(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  const title = req.body?.title;
  const completed = req.body?.completed;

  if (title === undefined && completed === undefined) {
    return res.status(400).json({ message: 'Provide a title or completed status to update' });
  }

  if (title !== undefined && !isValidTitle(title)) {
    return res.status(400).json({ message: 'Title must be a non-empty string' });
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'Completed must be a boolean' });
  }

  // Validate everything before making changes so invalid requests change nothing.
  const updates = {};
  if (title !== undefined) {
    updates.title = title.trim();
  }

  // Check for undefined, not truthiness: false is a valid update.
  if (completed !== undefined) {
    updates.completed = completed;
  }

  // $set changes only the supplied fields. Return the document after updating it.
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  );

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.json(toTaskResponse(task));
}

async function deleteTask(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // A successful deletion returns 204 with no response body.
  res.status(204).send();
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
