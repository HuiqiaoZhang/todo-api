const express = require('express');
const todoService = require('./todoService');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Todo API',
            version: '1.0.0',
            description: 'A simple Todo API documented with Swagger',
        },
        servers: [
            {
                url: 'http://localhost:3000'
            }
        ],
    },
    apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /todos:
 *  get:
 *      summary: Get all todos
 *      description: Returns a list of todos. Supports JSON and CSV formats.
 *      parameters: 
 *          - in: query
 *            name: state
 *            schema: 
 *              type: string
 *            description: Filter todos by state (e.g. todo, doing, done)
 *      responses:
 *        200:
 *          description: Successful response.
 *          content: 
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  type: object
 *            text/csv:
 *              schema: 
 *                type: string
 *                example: "id, title, state\n1,Study API,todo"           
 */

app.get('/todos', (req, res) => {
    let todos = todoService.getAllTodos();
    const stateQuery = req.query.state;

    if (stateQuery) {
        const states = stateQuery.split('|');
        const filtered = todos.filter(t => states.includes(t.state));
    }
    
    const acceptFormat = req.accepts(['application/json', 'text/csv']);

    if (acceptFormat === 'text/csv') {
        const csvData = todoService.toCsv(todos);
        res.set('Content-Type', 'text/csv');
        return res.status(200).send(csvData);
    }
    res.status(200).json(todos);
})

/**
 * @openapi
 * /todos:
 *  post:
 *      summary: create a new todo
 *      requestBody:
 *        required: true
 *        content: 
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - title
 *              properties:
 *                title:
 *                  type: string
 *                description:
 *                  type: string
 *                state:
 *                  type: string
 *        responses:
 *          201:
 *            description: Created
 *          400:
 *            description: Bad Request        
 */

app.post('/todos', (req, res) => {
    const errorMsg = todoService.validateTodoData(req.body);
    if (errorMsg) 
        return res.status(400).json({ error: errorMsg });

    const { title, description, state, dueDate } = req.body;
    const newTodo = todoService.createTodo(title, description, state, dueDate);
    res.status(201).json(newTodo);
});

/**
 * @openapi
 * /todos/{id}:
 *  get:
 *      summary: Get a single todo by ID
 *      parameters: 
 *          - in: path
 *            name: id
 *            required: true
 *            schema: 
 *              type: string
 *      responses:
 *        200:
 *          description: Successful response.
 *        404:
 *          description: Not Found
 */

app.get('/todos/:id', (req,res) => {
    const todo = todoService.findTodoById(req.params.id);

    if (!todo)
        return res.status(404).json({ error: "Not Found" });
    res.status(200).json(todo);
});

/**
 * @openapi
 * /todos/{id}:
 *   put:
 *      summary: Update a todo by ID
 *      parameters: 
 *          - in: path
 *            name: id
 *            required: true
 *            schema: 
 *              type: string
 *      requestBody:
 *        required: true
 *        content: 
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                title:
 *                  type: string
 *                description:
 *                  type: string
 *                state:
 *                  type: string
 *      responses:
 *        200:
 *          description: Updated
 *        404:
 *          description: Not Found
 */

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

/**
 * @openapi
 * /todos/{id}:
 *   delete:
 *      summary: Delete a todo by ID
 *      parameters: 
 *          - in: path
 *            name: id
 *            required: true
 *            schema: 
 *              type: string
 *      responses:
 *        204:
 *          description: Deleted successfully
 *        404:
 *          description: Not Found
 */

app.delete('/todos/:id', (req,res) => {
    const index = todoService.findTodoIndex(req.params.id);
    if (index === -1)
        return res.status(404).json({ error: "Not Found"});
    
    todoService.deleteTodo(index);
    res.status(204).send();
});

module.exports = app;

if (require.main === module) {
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
}