const express = require('express');
const todoService = require('./todoService');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());
app.use(cookieParser());

const ACCESS_TOKEN_SECRET = "my_super_secret_access_key";
const REFRESH_TOKEN_SECRET = "my_super_secret_refresh_key";

const USERS = [{ id: 1, username: "admin", password: "password123" }];

let validRefreshTokens = [];

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Too many login attempts, please try again 15 minutes" } 
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token)
        return res.status(401).json({ error: "Access Token Required" });

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ error: "Invalid of Expired Access Token" });
        req.user = user;
        next();
    });
}

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Todo API with JWT Auth',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:3000'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        }
    },
    apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /login:
 *    post:
 *      summary: User login
 *      requestBody: 
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                password:
 *                  type: string
 *      responses:
 *        200:
 *          description: Returns Access Token (Refresh Token is set in Cookie)
 *        401:
 *          description: Invalid credentials
 */
app.post('/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(u => u.username === username && u.password === password);

    if (!user)
        return res.status(401).json({ error: "Invalid username or password" });

    const accessToken = jwt.sign(
        {id: user.id, username: user.username }, 
        ACCESS_TOKEN_SECRET, 
        { expiresIn: '15m'}
    );

    const refreshToken = jwt.sign(
        { id: user.id, username: user.username },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    validRefreshTokens.push(refreshToken);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ accessToken });
});

/**
 * @openapi
 * /refresh:
 *    post:
 *      summary: Get a new Access Token using Refresh Token
 *      responses:
 *        200:
 *          description: New Access Token generated
 *        401:
 *          description: Invalid Refresh Token
 */
app.post('/refresh', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken)
        return res.status(401).json({ error: "Refresh Token Required" });
    
    if (!validRefreshTokens.includes(refreshToken)) 
        return res.status(403).json({ error: "Invalid Refresh Token" });
    
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) 
            return res.status(403).json({ error: "Expired Refresh Token" });

        const newAccessToken = jwt.sign(
            { id: user.id, username: user.username },
            ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );
        res.status(200).json({ accessToken: newAccessToken });
    });
});

/**
 * @openapi
 * /logout:
 *   post:
 *    summary: Logout and invalidate Refresh Token
 *    responses:
 *      200:
 *        descriptions: Logged out successfully
 */
app.post('/logout', (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    validRefreshTokens = validRefreshTokens.filter(token => token !== refreshToken);

    res.clearCookie('refreshToken');
    res.status(200).json({ message: "Logged out successfully" });
});


/**
 * @openapi
 * /todos:
 *  get:
 *      summary: Get all todos
 *      security:
 *          - bearerAuth: []
 *      parameters: 
 *          - in: query
 *            name: state
 *            schema: 
 *              type: string
 *      responses:
 *        200:
 *          description: Successful response.
 *        401:
 *          description: Unauthorized          
 */

app.get('/todos', authenticateToken, (req, res) => {
    let todos = todoService.getAllTodos();
    const stateQuery = req.query.state;

    if (stateQuery) {
        const states = stateQuery.split('|');
        todos = todos.filter(t => states.includes(t.state));
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
 *      security:
 *        - bearerAuth: []
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
 *                state:
 *                  type: string
 *        responses:
 *          201:
 *            description: Created
 *          401:
 *            description: Unauthorized       
 */

app.post('/todos', authenticateToken, (req, res) => {
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

app.get('/todos/:id', authenticateToken, (req,res) => {
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

app.put('/todos/:id', authenticateToken, (req,res) => {
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

app.delete('/todos/:id', authenticateToken, (req,res) => {
    const index = todoService.findTodoIndex(req.params.id);
    if (index === -1)
        return res.status(404).json({ error: "Not Found"});
    
    todoService.deleteTodo(index);
    res.status(204).send();
});

app.get('/', (req, res) => {
    res.send('Welcome to Todo API. Visit /doc for API documentation, or /login to authenticate.');
});

module.exports = app;

if (require.main === module) {
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
}