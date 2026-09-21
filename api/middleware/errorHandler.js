// Express 5 sends rejected async handlers here automatically.
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: 'Invalid task data' });
  }

  // Do not expose database details or credentials in responses.
  res.status(500).json({ message: 'Unable to complete the request' });
}

module.exports = errorHandler;
