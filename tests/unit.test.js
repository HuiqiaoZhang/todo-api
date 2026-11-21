const assert = require('assert');
const todoService = require('../todoService');

console.log("Starting Unit Test:");
try {
    const err1 = todoService.validateTodoData({ state: "todo" });
    assert.strictEqual(err1, "title is required", "Validation failed: title is required");
    console.log("Unit Test 1 Passed: Missing Title Validation");

    const err2 = todoService.validateTodoData({ title: "test", state: "invalid" });
    assert.strictEqual(err2, "invalid state", "Validation failed: invalid state");
    console.log("Unit Test 2 Passed: Invalid State Validation");

    const err3 = todoService.validateTodoData({ title: "Valid Task", state: "doing"});
    assert.strictEqual(err3, null, "Validation failed: expected null for valid data");
    console.log("Unit Test 3 Passed: Valid Data Validation");

    const newTodo = todoService.createTodo("Buy milk", "From store", "todo");
    assert.strictEqual(newTodo.title, "Buy milk");
    assert.strictEqual(newTodo.state, "todo");
    assert.ok(newTodo.id, "ID should be generated");
    console.log("Unit Test 4 Passed: Create Todo Logic");
} catch (error) {
    console.error("Unit Test Failed: error.message");
}