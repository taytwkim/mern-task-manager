// Relative URLs go through Vite's /api proxy during development.
export async function requestTasks(path = '', options = {}) {
  let response
  try {
    response = await fetch(`/api/tasks${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.')
  }

  // DELETE returns 204 without JSON, so do not call response.json() for it.
  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  // fetch does not throw automatically for HTTP 400/404/500 responses.
  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status}). Check that the backend is running.`)
  }
  if (data === null) throw new Error('The server returned an unexpected response.')
  return data
}
