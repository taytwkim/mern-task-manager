import { useState } from 'react'

// Props pass a task and its action handlers down from App.
function TaskItem({ task, onUpdate, onDelete, busy }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(task.title)

  function startEditing() {
    setDraftTitle(task.title)
    setIsEditing(true)
  }

  async function saveTitle(event) {
    event.preventDefault()
    if (!draftTitle.trim() || busy) return
    const saved = await onUpdate(task.id, { title: draftTitle.trim() })
    if (saved) setIsEditing(false)
  }

  return (
    <li className="task-item">
      <label className="task-label">
        <input
          type="checkbox"
          checked={task.completed}
          disabled={busy}
          onChange={(event) => onUpdate(task.id, { completed: event.target.checked })}
        />
        <span className={task.completed ? 'completed' : ''}>{task.title}</span>
      </label>
      {isEditing ? (
        <form className="edit-form" onSubmit={saveTitle}>
          <label htmlFor={`title-${task.id}`}>Edit title</label>
          <input
            id={`title-${task.id}`}
            value={draftTitle}
            disabled={busy}
            onChange={(event) => setDraftTitle(event.target.value)}
            required
          />
          <button type="submit" disabled={busy || !draftTitle.trim()}>Save</button>
          <button type="button" disabled={busy} onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <button type="button" disabled={busy} onClick={startEditing}>Edit</button>
      )}
      <button type="button" disabled={busy} onClick={() => onDelete(task.id)}>Delete</button>
    </li>
  )
}

export default TaskItem
