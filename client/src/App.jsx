import { useEffect, useState } from 'react'
import TaskItem from './components/TaskItem'
import { requestTasks } from './api'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const busy = loading || saving

  // Fetch tasks when the screen opens. Ignore results after cleanup/unmount.
  useEffect(() => {
    let ignore = false
    requestTasks()
      .then((data) => { if (!ignore) setTasks(data) })
      .catch((err) => { if (!ignore) setError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])

  async function loadTasks() {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      setTasks(await requestTasks())
      setMessage('Tasks refreshed.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createTask(event) {
    event.preventDefault()
    if (!title.trim() || busy) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const task = await requestTasks('', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim() }),
      })
      // Functional updates use the latest state without mutating the array.
      setTasks((current) => [...current, task])
      setTitle('')
      setMessage('Task added.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateTask(id, updates) {
    if (busy) return false
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await requestTasks(`/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      setTasks((current) => current.map((task) => task.id === id ? updated : task))
      setMessage('Task updated.')
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function deleteTask(id) {
    if (busy) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await requestTasks(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
      setTasks((current) => current.filter((task) => task.id !== id))
      setMessage('Task deleted.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="task-manager" aria-busy={busy}>
      <h1>Task Manager</h1>
      <p className="hint">Add tasks, edit their titles, and mark them complete.</p>
      <form className="new-task" onSubmit={createTask}>
        <label htmlFor="new-title">New task</label>
        <div className="input-row">
          <input id="new-title" value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to get done?" required disabled={busy} />
          <button type="submit" disabled={busy || !title.trim()}>Add task</button>
        </div>
      </form>
      <div className="list-heading">
        <h2>Tasks ({tasks.length})</h2>
        <button type="button" onClick={loadTasks} disabled={busy}>Refresh</button>
      </div>
      {loading ? <p role="status">Loading tasks…</p> : null}
      {!loading && !error && tasks.length === 0 ? <p>No tasks yet. Add your first task above.</p> : null}
      <ul className="task-list">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} busy={busy} />
        ))}
      </ul>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <p className="status" role="status">{saving ? 'Saving…' : message}</p>
    </main>
  )
}

export default App
