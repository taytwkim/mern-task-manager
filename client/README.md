# Frontend

Run the backend with `npm run dev` in `api`, then run `npm install` and
`npm run dev` in `client` in a second terminal. Open the URL Vite prints.

The screen loads tasks from MongoDB through the Express API. It supports create,
rename, completion toggling, deletion, and refresh. Loading and saving disable
controls. Failed requests display an error and preserve tasks and input drafts.

- `src/App.jsx`: task state and GET/POST/PATCH/DELETE handlers.
- `src/api.js`: shared fetch, HTTP error handling, and empty 204 responses.
- `src/components/TaskItem.jsx`: task row and title editor.
- `vite.config.js`: forwards `/api` to Express at `http://127.0.0.1:3000` during development.

If your backend uses a different port, update the proxy target. Restart Vite
when changing its configuration. The MongoDB URI belongs only in `api/.env`.

The Vite proxy is for development. For production, configure your hosting to
forward `/api` to the backend, or configure a separate API URL and backend CORS.
The static build alone does not run Express or supply that proxy.

Run `npm run build` to build and `npm run lint` to check the code.
Run `npm test` for request-helper tests with mocked HTTP responses.
