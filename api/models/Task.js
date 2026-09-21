const mongoose = require('mongoose');

// A schema describes the fields and validation rules for a task document.
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

// The Task model provides database methods such as Task.find() and Task.create().
// Mongoose uses the "tasks" collection and adds an _id to each document.
module.exports = mongoose.model('Task', taskSchema);
