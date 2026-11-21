const request = require('supertest');
const assert = require('assert');
const app = require('../server');

console.log("Starting Integration Test:");

async function runTests() {
    try {
        const res1 = await request(app).post('/todos').send({ title: "API Test" });
        assert.strictEqual(res1.statusCode, 201, "Should return 201 for successful creation");
        assert.strictEqual(res1.body.title, "API Test");
        console.log("Integration Test 1 Passed: POST /todos -> 201 created");

        const res2 = await request(app).post('/todos').send({ state: "todo" });
        assert.strictEqual(res2.statusCode, 400, "Should return 400 for bad request(missing title)");
        console.log("Integration Test 2 Passed: POST /todos (missing title) -> 400 Bad Request");

        const res3 = await request(app).post('/todos/9999');
        assert.strictEqual(res3.statusCode, 404, "Should return 404 for non-existent resource");
        console.log("Integration Test 3 Passed: GET /todos/9999 -> 404 Not Found");
    } catch (error) {
        console.error("Integration Test Failed:", error.message);
    }
}

runTests();