const { v4: uuidv4 } = require('uuid');
const ALLOWED_STATES = ['todo', 'doing', 'done'];

let todos = [
  {
    "id": uuidv4(),
    "title": "Study REST APIs",
    "description": "Read a dissertation by Roy Fielding",
    "state": "todo",
    "createdAt": new Date(),
    "updatedAt": new Date()
  }
];

function validateTodoData(data, isUpdate = false) {
  if (!isUpdate && !data.title)
    return "title is required";
  if (data.state && !ALLOWED_STATES.includes(data.state))
    return "invalid state";
  return null;
}

function createTodo(title, description, state, dueDate) {
  const newTodo = {
    id: uuidv4(),
    title,
    description: description || "",
    state: state || "todo",
    dueDate: dueDate || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  todos.push(newTodo);
  return newTodo;
}

function getAllTodos() {
  return todos;
}

function findTodoById(id) {
  return todos.find(item => item.id === id);
}

function findTodoIndex(id) {
  return todos.findIndex(item => item.id === id);
}

function updateTodo(index, updateData) {
  todos[index] = {
    ...todos[index],
    ...updateData,
    updatedAt: new Date()
  };
  return todos[index];
}

function deleteTodo(index) {
  todos.splice(index, 1);
}

module.exports = {
  validateTodoData,
  createTodo,
  getAllTodos,
  findTodoById,
  findTodoIndex,
  updateTodo,
  deleteTodo,
  ALLOWED_STATES
};