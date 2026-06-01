// cypress/support/e2e.js

Cypress.Commands.add("createTodo", (text) => {
  cy.get('[data-testid="todo-input"]').type(text);
  cy.get('[data-testid="btn-add"]').click();
});

Cypress.Commands.add("createTodoViaAPI", (text) => {
  cy.request("POST", "/api/todos", { text }).its("body").should("have.property", "id");
});

// Reseta o store do servidor antes de cada teste (uma única requisição)
beforeEach(() => {
  cy.request("POST", "/test/reset");
});
