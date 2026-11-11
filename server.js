const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

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

const ALLOWED_STATES = ['todo', 'doing', 'done'];

app.post('/todos', (req, res) => {
    const { title, description, state, dueDate } = req.body;
    if (!title) 
        return res.status(400).json({ error: "title is required" });
    if (state && !ALLOWED_STATES.includes(state))
        return res.status(400).json ({ error: "invalid state"});

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
    res.status(201).json(newTodo);
});

app.get('/todos', (req, res) => {
    const stateQuery = req.query.state;

    if (stateQuery) {
        const states = stateQuery.split('|');
        const filtered = todos.filter(t => states.includes(t.state));
        return res.status(200).json(filtered);
    }
    res.status(200).json(todos);
});

app.get('/todos/:id', (req,res) => {
    const todo = todos.find(item => item.id === req.params.id);

    if (!todo)
        return res.status(404).json({ error: "Not Found" });
    res.status(200).json(todo);
});

app.put('/todos/:id', (req,res) => {
    const index = todos.findIndex(item => item.id === req.params.id);
    if (index === -1)
        return res.status(404).json({ error: "Not Found"});

    const { title, description, state, dueDate } = req.body;

    if (state && !ALLOWED_STATES.includes(state)) {
        return res.status(400).json({ error: "invalid state" });
    }

    todos[index] = {
        ...todos[index],
        ...(title && { title }),
        ...(description && { description }),
        ...(state && { state }),
        ...(dueDate && { dueDate }),
        updatedAt: new Date()
    };
    res.status(200).json(todos[index]);
});

app.delete('/todos/:id', (req,res) => {
    const index = todos.findIndex(item => item.id === req.params.id);
    if (index === -1)
        return res.status(404).json({ error: "Not Found"});
    
    todos.splice(index, 1);
    res.status(204).send();
});

app.listen(3000, () => console.log('Server running on port 3000'));


