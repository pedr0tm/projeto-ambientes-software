/**
 * cypress/e2e/frontend.cy.js
 * Testes de interface do usuário (frontend)
 */

describe("🖥️ Frontend — Interface do Usuário", () => {

  beforeEach(() => {
    cy.visit("/");
    cy.get('[data-testid="todo-list"]').should("exist");
  });

  // ── Carregamento da página ──────────────────────────────────────────────────
  describe("Carregamento inicial", () => {
    it("deve exibir o título TAREFAS", () => {
      cy.contains("TAREFAS").should("be.visible");
    });

    it("deve exibir o campo de input", () => {
      cy.get('[data-testid="todo-input"]').should("be.visible").and("have.attr", "placeholder");
    });

    it("deve exibir o botão Adicionar", () => {
      cy.get('[data-testid="btn-add"]').should("be.visible");
    });

    it("deve exibir os filtros de tarefas", () => {
      cy.get('[data-testid="filter-all"]').should("be.visible");
      cy.get('[data-testid="filter-pending"]').should("be.visible");
      cy.get('[data-testid="filter-done"]').should("be.visible");
    });

    it("deve exibir estado vazio quando não há tarefas", () => {
      cy.get('[data-testid="empty-state"]').should("be.visible");
    });
  });

  // ── Adicionar tarefas ───────────────────────────────────────────────────────
  describe("Adicionar tarefa", () => {
    it("deve adicionar tarefa ao clicar no botão", () => {
      cy.createTodo("Estudar Cypress");
      cy.get('[data-testid="todo-list"]').should("contain", "Estudar Cypress");
    });

    it("deve adicionar tarefa ao pressionar Enter", () => {
      cy.get('[data-testid="todo-input"]').type("Tarefa com Enter{enter}");
      cy.get('[data-testid="todo-list"]').should("contain", "Tarefa com Enter");
    });

    it("deve limpar o input após adicionar", () => {
      cy.createTodo("Limpar input teste");
      cy.get('[data-testid="todo-input"]').should("have.value", "");
    });

    it("deve esconder o estado vazio após adicionar tarefa", () => {
      cy.createTodo("Primeira tarefa");
      cy.get('[data-testid="empty-state"]').should("not.be.visible");
    });

    it("deve mostrar erro ao tentar adicionar tarefa vazia", () => {
      cy.get('[data-testid="btn-add"]').click();
      cy.contains("Digite o texto").should("be.visible");
    });

    it("deve atualizar o contador de caracteres ao digitar", () => {
      cy.get('[data-testid="todo-input"]').type("abc");
      cy.contains("3 / 200").should("be.visible");
    });

    it("deve adicionar múltiplas tarefas", () => {
      cy.createTodo("Tarefa Um");
      cy.createTodo("Tarefa Dois");
      cy.createTodo("Tarefa Três");
      cy.get('[data-testid="todo-list"] li').should("have.length", 3);
    });
  });

  // ── Marcar como concluída ───────────────────────────────────────────────────
  describe("Marcar tarefa como concluída", () => {
    beforeEach(() => {
      cy.createTodo("Tarefa para concluir");
    });

    it("deve marcar tarefa como concluída ao clicar no checkbox", () => {
      cy.get('[data-testid="todo-list"] li').first()
        .find("input[type='checkbox']").check();

      cy.get('[data-testid="todo-list"] li').first()
        .should("have.class", "done");
    });

    it("deve desmarcar tarefa concluída ao clicar novamente", () => {
      cy.get('[data-testid="todo-list"] li').first()
        .find("input[type='checkbox']").check();

      cy.get('[data-testid="todo-list"] li').first()
        .find("input[type='checkbox']").uncheck();

      cy.get('[data-testid="todo-list"] li').first()
        .should("not.have.class", "done");
    });
  });

  // ── Filtros ─────────────────────────────────────────────────────────────────
  describe("Filtros de tarefas", () => {
    beforeEach(() => {
      cy.createTodo("Tarefa Pendente 1");
      cy.createTodo("Tarefa Pendente 2");
      cy.createTodo("Tarefa a Concluir");

      // Marcar a última como concluída via API para velocidade
      cy.request("GET", "/api/todos").then((res) => {
        cy.request("PUT", `/api/todos/${res.body[0].id}`, { done: true });
      });
      cy.reload();
    });

    it("deve mostrar todas as tarefas no filtro 'Todas'", () => {
      cy.get('[data-testid="filter-all"]').click();
      cy.get('[data-testid="todo-list"] li').should("have.length.at.least", 3);
    });

    it("deve mostrar só pendentes no filtro 'Pendentes'", () => {
      cy.get('[data-testid="filter-pending"]').click();
      cy.get('[data-testid="todo-list"] li').each(($el) => {
        cy.wrap($el).should("not.have.class", "done");
      });
    });

    it("deve mostrar só concluídas no filtro 'Concluídas'", () => {
      cy.get('[data-testid="filter-done"]').click();
      cy.get('[data-testid="todo-list"] li').each(($el) => {
        cy.wrap($el).should("have.class", "done");
      });
    });

    it("deve destacar o filtro ativo", () => {
      cy.get('[data-testid="filter-pending"]').click();
      cy.get('[data-testid="filter-pending"]').should("have.class", "active");
      cy.get('[data-testid="filter-all"]').should("not.have.class", "active");
    });
  });

  // ── Editar tarefas ──────────────────────────────────────────────────────────
  describe("Editar tarefa", () => {
    beforeEach(() => {
      cy.createTodo("Texto original");
    });

    it("deve abrir modal ao clicar no botão de editar", () => {
      cy.get('[data-testid="todo-list"] li').first()
        .find(".btn-edit").click({ force: true });
      cy.get('[data-testid="modal-overlay"]').should("have.class", "open");
    });

    it("deve preencher o modal com o texto atual da tarefa", () => {
      cy.get('[data-testid="todo-list"] li').first().find(".btn-edit").click({ force: true });
      cy.get('[data-testid="edit-input"]').should("have.value", "Texto original");
    });

    it("deve salvar o novo texto da tarefa", () => {
      cy.get('[data-testid="todo-list"] li').first().find(".btn-edit").click({ force: true });
      cy.get('[data-testid="edit-input"]').clear().type("Texto editado");
      cy.get('[data-testid="btn-save"]').click();
      cy.get('[data-testid="todo-list"]').should("contain", "Texto editado");
      cy.get('[data-testid="todo-list"]').should("not.contain", "Texto original");
    });

    it("deve fechar o modal ao cancelar", () => {
      cy.get('[data-testid="todo-list"] li').first().find(".btn-edit").click({ force: true });
      cy.get('[data-testid="btn-cancel"]').click();
      cy.get('[data-testid="modal-overlay"]').should("not.have.class", "open");
    });

    it("deve fechar o modal ao clicar no X", () => {
      cy.get('[data-testid="todo-list"] li').first().find(".btn-edit").click({ force: true });
      cy.get('[data-testid="modal-close"]').click();
      cy.get('[data-testid="modal-overlay"]').should("not.have.class", "open");
    });

    it("deve fechar o modal ao pressionar Escape", () => {
      cy.get('[data-testid="todo-list"] li').first().find(".btn-edit").click({ force: true });
      cy.get('[data-testid="edit-input"]').type("{esc}");
      cy.get('[data-testid="modal-overlay"]').should("not.have.class", "open");
    });
  });

  // ── Remover tarefas ─────────────────────────────────────────────────────────
  describe("Remover tarefa", () => {
    it("deve remover tarefa ao clicar no botão de excluir", () => {
      cy.createTodo("Tarefa para remover");
      cy.get('[data-testid="todo-list"] li').first().find(".btn-delete").click({ force: true });
      cy.get('[data-testid="todo-list"]').should("not.contain", "Tarefa para remover");
    });

    it("deve mostrar estado vazio após remover a última tarefa", () => {
      cy.createTodo("Última tarefa");
      cy.get('[data-testid="todo-list"] li').first().find(".btn-delete").click({ force: true });
      cy.get('[data-testid="empty-state"]').should("be.visible");
    });
  });

  // ── Limpar concluídas ───────────────────────────────────────────────────────
  describe("Limpar tarefas concluídas", () => {
    it("deve remover apenas as tarefas concluídas", () => {
      cy.createTodo("Pendente permanente");
      cy.createTodo("A ser concluída");

      cy.get('[data-testid="todo-list"] li').first()
        .find("input[type='checkbox']").check();

      cy.get('[data-testid="btn-clear"]').click();

      cy.get('[data-testid="todo-list"]').should("contain", "Pendente permanente");
    });
  });

  // ── Contadores / stats ──────────────────────────────────────────────────────
  describe("Estatísticas de tarefas", () => {
    it("deve atualizar o contador total ao adicionar tarefas", () => {
      cy.createTodo("Tarefa 1");
      cy.createTodo("Tarefa 2");
      cy.get("#count-total").should("have.text", "2");
    });

    it("deve atualizar contador de pendentes e concluídas", () => {
      cy.createTodo("Tarefa contagem");
      cy.get('[data-testid="todo-list"] li').first()
        .find("input[type='checkbox']").check();
      cy.get("#count-done").should("have.text", "1");
      cy.get("#count-pending").should("have.text", "0");
    });
  });
});
