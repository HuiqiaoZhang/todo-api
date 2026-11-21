const express = require('express');
const todoService = require('./todoService');

const app = express();
app.use(express.json());

app.post('/todos', (req, res) => {
    const errorMsg = todoService.validateTodoData(req.body);
    if (errorMsg) 
        return res.status(400).json({ error: errorMsg });

    const { title, description, state, dueDate } = req.body;
    const newTodo = todoService.createTodo(title, description, state, dueDate);
    res.status(201).json(newTodo);
});

app.get('/todos', (req, res) => {
    let todos = todoService.getAllTodos();
    const stateQuery = req.query.state;

    if (stateQuery) {
        const states = stateQuery.split('|');
        const filtered = todos.filter(t => states.includes(t.state));
        return res.status(200).json(filtered);
    }
    res.status(200).json(todos);
});

app.get('/todos/:id', (req,res) => {
    const todo = todoService.findTodoById(req.params.id);

    if (!todo)
        return res.status(404).json({ error: "Not Found" });
    res.status(200).json(todo);
});

app.put('/todos/:id', (req,res) => {
    const index = todoService.findTodoIndex(req.params.id);
    if (index === -1)
        return res.status(404).json({ error: "Not Found"});

    const errorMsg = todoService.validateTodoData(req.body, true);
    if (errorMsg)
        return res.status(400).json({ error: errorMsg });

    const { title, description, state, dueDate } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (state) updateData.state = state;
    if (dueDate) updateData.dueDate = duedate;

    const updatedTodo = todoService.updateTodo(index, updateData);
    res.status(200).json(updatedTodo);
});

app.delete('/todos/:id', (req,res) => {
    const index = todoService.findTodoIndex(req.params.id);
    if (index === -1)
        return res.status(404).json({ error: "Not Found"});
    
    todoService.deleteTodo(index);
    res.status(204).send();
});

module.exports = app;

if (require.main === module) {
    app.listen(3000, () => console.log('Server running on port 3000'));
}