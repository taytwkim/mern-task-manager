const express = require('express');
const taskRoutes = require('./routes/tasks');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies so handlers can read req.body.
app.use(express.json());

// Forward requests beginning with /api/tasks to the task router.
app.use('/api/tasks', taskRoutes);
app.use(errorHandler);

async function startServer() {
  // Do not accept HTTP requests until the database connection is ready.
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
