# API

Run commands in this directory. Use Node.js 24 or newer with built-in `--env-file` support.

1. Run `npm install` to install dependencies.

2. If `.env` is missing, copy `.env.example` to `.env`.

3. Set `MONGODB_URI` in `.env` to your Atlas connection string, including your
   database username and password. Select the database by placing `task_manager`
   after the host's slash and before any query string:

   ```text
   mongodb+srv://USERNAME:PASSWORD@CLUSTER_HOST/task_manager?retryWrites=true&w=majority
   ```

   Replace the placeholders with your actual values, retaining the options from
   Atlas. Percent-encode special characters in the username or password when
   inserting them into the URI (for example, `@` becomes `%40`). Keep `.env`
   private; the project's `.gitignore` already excludes it.

4. Ensure your current IP is allowed in Atlas and the database user can access
   this database.

5. Run `npm run dev`. Successful startup prints `Connected to MongoDB`, followed
   by the server URL. Restart the command after changing `.env`.

The npm start scripts load `.env` into `process.env`. `config/db.js` opens the
Mongoose connection, and `index.js` waits for it before starting Express. A
missing URI or failed connection stops startup with an error.

The task controllers use the Task model to store documents in MongoDB's `tasks`
collection. Tasks survive server restarts. API responses expose MongoDB's `_id`
as an `id` string; use the ID returned by POST for PATCH and DELETE requests.
Malformed IDs return 400; valid IDs with no matching task return 404.

To check persistence, create a task with POST `/api/tasks`, restart the server,
and request GET `/api/tasks`. The task should still appear. The database may not
appear in Atlas until data is first written.

Run `npm test` for controller tests with mocked database calls and model
validation tests. They do not require MongoDB or write to your Atlas database.
