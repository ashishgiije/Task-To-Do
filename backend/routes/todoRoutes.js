const express = require("express");
const Todo = require("../models/Todo");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

const normalizeSubtasks = (subtasks) => {
  if (!Array.isArray(subtasks)) return [];
  return subtasks
    .filter((subtask) => subtask && subtask.title)
    .map((subtask) => ({
      title: String(subtask.title).trim(),
      completed: Boolean(subtask.completed),
      completedAt:
        subtask.completed && subtask.completedAt ? new Date(subtask.completedAt) : null,
    }));
};

router.get("/", async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user }).sort({ order: 1, createdAt: -1 });
    return res.json(todos);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const {
    title,
    recurrence = "none",
    notes = "",
    subtasks = [],
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  try {
    const count = await Todo.countDocuments({ user: req.user });
    const todo = await Todo.create({
      title,
      user: req.user,
      completed: false,
      completedAt: null,
      recurrence,
      notes: String(notes).trim(),
      subtasks: normalizeSubtasks(subtasks),
      order: count,
    });
    return res.status(201).json(todo);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/reorder/list", async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ message: "orderedIds must be an array" });
  }

  try {
    await Promise.all(
      orderedIds.map((id, index) =>
        Todo.updateOne({ _id: id, user: req.user }, { $set: { order: index } })
      )
    );
    const todos = await Todo.find({ user: req.user }).sort({ order: 1, createdAt: -1 });
    return res.json(todos);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const nextCompleted =
      typeof req.body.completed === "boolean" ? req.body.completed : todo.completed;
    todo.completed = nextCompleted;
    todo.completedAt = nextCompleted ? new Date() : null;

    if (typeof req.body.title === "string") {
      todo.title = req.body.title.trim() || todo.title;
    }
    if (typeof req.body.recurrence === "string") {
      todo.recurrence = req.body.recurrence;
    }
    if (typeof req.body.notes === "string") {
      todo.notes = req.body.notes.trim();
    }
    if (Array.isArray(req.body.subtasks)) {
      todo.subtasks = normalizeSubtasks(req.body.subtasks);
    }

    await todo.save();

    return res.json(todo);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user,
    });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    return res.json({ message: "Todo deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
