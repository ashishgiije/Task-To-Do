import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const Todo = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "User");
  const [dragId, setDragId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    notes: "",
    recurrence: "none",
    subtasks: "",
  });
  const [error, setError] = useState("");

  const fetchTodos = async () => {
    try {
      const { data } = await API.get("/todos");
      setTodos(data);
    } catch (err) {
      setError("Could not load todos");
    }
  };

  useEffect(() => {
    fetchTodos();
    const fetchUserProfile = async () => {
      try {
        const { data } = await API.get("/auth/me");
        const name = data?.user?.name || "User";
        setUserName(name);
        localStorage.setItem("userName", name);
      } catch (err) {
        // Keep fallback name for invalid/missing sessions.
      }
    };
    fetchUserProfile();
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString();
  };

  const parseLines = (rawValue) =>
    rawValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const subtasks = parseLines(form.subtasks).map((title) => ({
      title,
      completed: false,
      completedAt: null,
    }));

    try {
      await API.post("/todos", {
        title: form.title,
        notes: form.notes,
        recurrence: form.recurrence,
        subtasks,
      });
      setForm({
        title: "",
        notes: "",
        recurrence: "none",
        subtasks: "",
      });
      fetchTodos();
    } catch (err) {
      setError("Failed to add todo");
    }
  };

  const toggleTodo = async (todo) => {
    const nextCompleted = !todo.completed;
    const nextCompletedAt = nextCompleted ? new Date().toISOString() : null;

    // Optimistic update so cards refresh instantly on click.
    setTodos((prevTodos) =>
      prevTodos.map((item) =>
        item._id === todo._id
          ? { ...item, completed: nextCompleted, completedAt: nextCompletedAt }
          : item
      )
    );

    try {
      const { data: updatedTodo } = await API.put(`/todos/${todo._id}`, { completed: nextCompleted });
      setTodos((prevTodos) =>
        prevTodos.map((item) => (item._id === updatedTodo._id ? updatedTodo : item))
      );
    } catch (err) {
      setError("Failed to update todo");
      fetchTodos();
    }
  };

  const deleteTodo = async (id) => {
    try {
      await API.delete(`/todos/${id}`);
      fetchTodos();
    } catch (err) {
      setError("Failed to delete todo");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  const toggleSubtask = async (todo, subtaskId) => {
    const updatedSubtasks = todo.subtasks.map((subtask) => {
      if (subtask._id !== subtaskId) return subtask;
      const isCompleted = !subtask.completed;
      return {
        ...subtask,
        completed: isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
      };
    });

    try {
      await API.put(`/todos/${todo._id}`, { subtasks: updatedSubtasks });
      fetchTodos();
    } catch (err) {
      setError("Failed to update subtask");
    }
  };

  const reorderTodos = async (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    const items = [...todos];
    const sourceIndex = items.findIndex((item) => item._id === sourceId);
    const targetIndex = items.findIndex((item) => item._id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [moved] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, moved);
    setTodos(items);

    try {
      await API.put("/todos/reorder/list", {
        orderedIds: items.map((item) => item._id),
      });
    } catch (err) {
      setError("Failed to reorder tasks");
      fetchTodos();
    }
  };

  const pendingTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  const renderTodoCard = (todo, draggable = false) => (
    <li
      key={todo._id}
      className="todo-item"
      draggable={draggable}
      onDragStart={() => draggable && setDragId(todo._id)}
      onDragOver={(event) => draggable && event.preventDefault()}
      onDrop={() => {
        if (draggable) {
          reorderTodos(dragId, todo._id);
          setDragId(null);
        }
      }}
      onDragEnd={() => draggable && setDragId(null)}
    >
      <div className="todo-content">
        <input
          type="checkbox"
          checked={todo.completed}
          readOnly
          onClick={(event) => {
            event.stopPropagation();
            toggleTodo(todo);
          }}
        />
        <div
          className="todo-main"
          onClick={() => toggleTodo(todo)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleTodo(todo);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <span className={todo.completed ? "completed" : ""}>{todo.title}</span>
          <p className="todo-meta">Repeat: {todo.recurrence || "none"}</p>
          {todo.notes ? <p className="todo-notes">{todo.notes}</p> : null}
          <p className="todo-meta">Added: {formatDateTime(todo.createdAt)}</p>
          <p className="todo-meta">
            Completed: {todo.completed ? formatDateTime(todo.completedAt) : "Not completed"}
          </p>
          {todo.subtasks?.length > 0 && (
            <div className="subtask-box">
              {todo.subtasks.map((subtask) => (
                <label key={subtask._id} className="subtask-item">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(todo, subtask._id)}
                    onClick={(event) => event.stopPropagation()}
                  />
                  <span className={subtask.completed ? "completed" : ""}>{subtask.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        className="delete-btn"
        onClick={(event) => {
          event.stopPropagation();
          deleteTodo(todo._id);
        }}
      >
        Delete
      </button>
    </li>
  );

  return (
    <div className="container">
      <h1 className="app-title">Task To-Do</h1>
      <div className="top-row">
        <h2>Task Dashboard</h2>
        <button className="logout-btn" onClick={logout}>
          <span className="profile-icon">👤</span> Logout
        </button>
      </div>
      <p className="welcome-text">Welcome, {userName}</p>
      <p className="subtitle">Track priorities, update progress, and complete work on time.</p>

      {error && <p className="error">{error}</p>}

      <div className="todo-board">
        <section className="board-card">
          <h3>Create Task</h3>
          <form onSubmit={addTodo} className="add-form">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title"
            />
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Task notes"
              rows={3}
            />
            <textarea
              value={form.subtasks}
              onChange={(e) => setForm({ ...form, subtasks: e.target.value })}
              placeholder="Subtasks (one per line)"
              rows={3}
            />
            <select
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
            >
              <option value="none">No recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button type="submit">Add Task</button>
          </form>
        </section>

        <section className="board-card">
          <h3>Todo Tasks</h3>
          <ul className="todo-list">
            {pendingTodos.map((todo) => renderTodoCard(todo, true))}
            {pendingTodos.length === 0 && <li className="empty-state">No pending tasks.</li>}
          </ul>
        </section>

        <section className="board-card">
          <h3>Completed Tasks</h3>
          <ul className="todo-list">
            {completedTodos.map((todo) => renderTodoCard(todo, false))}
            {completedTodos.length === 0 && <li className="empty-state">No completed tasks yet.</li>}
          </ul>
        </section>
      </div>
      <footer className="page-footer">
        Task To-DO | Built for focused planning and consistent execution.
      </footer>
    </div>
  );
};

export default Todo;
