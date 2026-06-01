/**
 * cypress/e2e/api.cy.js
 * Testes da API REST (backend) via cy.request()
 */

describe("🔌 API Backend — /api/todos", () => {
  // ── POST /api/todos ─────────────────────────────────────────────────────────
  describe("POST /api/todos — Criar tarefa", () => {
    it("deve criar uma nova tarefa com dados válidos", () => {
      cy.request("POST", "/api/todos", { text: "Minha tarefa de teste" })
        .then((res) => {
          expect(res.status).to.eq(201);
          expect(res.body).to.have.property("id");
          expect(res.body.text).to.eq("Minha tarefa de teste");
          expect(res.body.done).to.eq(false);
          expect(res.body).to.have.property("createdAt");
        });
    });

    it("deve retornar erro 400 quando texto está vazio", () => {
      cy.request({ method: "POST", url: "/api/todos", body: { text: "" }, failOnStatusCode: false })
        .then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body).to.have.property("error");
        });
    });

    it("deve retornar erro 400 quando texto não é enviado", () => {
      cy.request({ method: "POST", url: "/api/todos", body: {}, failOnStatusCode: false })
        .then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body.error).to.include("required");
        });
    });

    it("deve retornar erro 400 quando texto ultrapassa 200 caracteres", () => {
      const longText = "A".repeat(201);
      cy.request({ method: "POST", url: "/api/todos", body: { text: longText }, failOnStatusCode: false })
        .then((res) => {
          expect(res.status).to.eq(400);
        });
    });
  });

  // ── GET /api/todos ──────────────────────────────────────────────────────────
  describe("GET /api/todos — Listar tarefas", () => {
    beforeEach(() => {
      cy.request("POST", "/api/todos", { text: "Tarefa Pendente A" });
      cy.request("POST", "/api/todos", { text: "Tarefa Pendente B" });
    });

    it("deve retornar array de todas as tarefas", () => {
      cy.request("GET", "/api/todos").then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.be.an("array");
        expect(res.body.length).to.be.at.least(2);
      });
    });

    it("deve filtrar tarefas pendentes com ?status=pending", () => {
      cy.request("GET", "/api/todos").then((res) => {
        const id = res.body[0].id;
        cy.request("PUT", `/api/todos/${id}`, { done: true }).then(() => {
          cy.request("GET", "/api/todos?status=pending").then((filtered) => {
            expect(filtered.status).to.eq(200);
            filtered.body.forEach((t) => expect(t.done).to.be.false);
          });
        });
      });
    });

    it("deve filtrar tarefas concluídas com ?status=done", () => {
      cy.request("GET", "/api/todos").then((res) => {
        const id = res.body[0].id;
        cy.request("PUT", `/api/todos/${id}`, { done: true }).then(() => {
          cy.request("GET", "/api/todos?status=done").then((filtered) => {
            expect(filtered.status).to.eq(200);
            filtered.body.forEach((t) => expect(t.done).to.be.true);
          });
        });
      });
    });
  });

  // ── GET /api/todos/:id ──────────────────────────────────────────────────────
  describe("GET /api/todos/:id — Buscar por ID", () => {
    it("deve retornar uma tarefa específica pelo ID", () => {
      cy.request("POST", "/api/todos", { text: "Tarefa Individual" }).then((created) => {
        const id = created.body.id;
        cy.request("GET", `/api/todos/${id}`).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.id).to.eq(id);
          expect(res.body.text).to.eq("Tarefa Individual");
        });
      });
    });

    it("deve retornar 404 para ID inexistente", () => {
      cy.request({ method: "GET", url: "/api/todos/999999", failOnStatusCode: false }).then((res) => {
        expect(res.status).to.eq(404);
        expect(res.body).to.have.property("error");
      });
    });

    it("deve retornar 400 para ID inválido", () => {
      cy.request({ method: "GET", url: "/api/todos/abc", failOnStatusCode: false }).then((res) => {
        expect(res.status).to.eq(400);
      });
    });
  });

  // ── PUT /api/todos/:id ──────────────────────────────────────────────────────
  describe("PUT /api/todos/:id — Atualizar tarefa", () => {
    let todoId;

    beforeEach(() => {
      cy.request("POST", "/api/todos", { text: "Tarefa Original" }).then((res) => {
        todoId = res.body.id;
      });
    });

    it("deve atualizar o texto de uma tarefa", () => {
      cy.request("PUT", `/api/todos/${todoId}`, { text: "Texto Atualizado" }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.text).to.eq("Texto Atualizado");
      });
    });

    it("deve marcar tarefa como concluída", () => {
      cy.request("PUT", `/api/todos/${todoId}`, { done: true }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.done).to.be.true;
      });
    });

    it("deve desmarcar tarefa como concluída", () => {
      cy.request("PUT", `/api/todos/${todoId}`, { done: true });
      cy.request("PUT", `/api/todos/${todoId}`, { done: false }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.done).to.be.false;
      });
    });

    it("deve retornar 404 ao atualizar ID inexistente", () => {
      cy.request({ method: "PUT", url: "/api/todos/999999", body: { text: "X" }, failOnStatusCode: false })
        .then((res) => {
          expect(res.status).to.eq(404);
        });
    });

    it("deve retornar 400 ao tentar salvar texto vazio na atualização", () => {
      cy.request({ method: "PUT", url: `/api/todos/${todoId}`, body: { text: "   " }, failOnStatusCode: false })
        .then((res) => {
          expect(res.status).to.eq(400);
        });
    });
  });

  // ── DELETE /api/todos/:id ───────────────────────────────────────────────────
  describe("DELETE /api/todos/:id — Remover tarefa", () => {
    it("deve remover uma tarefa existente", () => {
      cy.request("POST", "/api/todos", { text: "Para deletar" }).then((created) => {
        const id = created.body.id;
        cy.request("DELETE", `/api/todos/${id}`).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.id).to.eq(id);
        });
        cy.request({ method: "GET", url: `/api/todos/${id}`, failOnStatusCode: false }).then((res) => {
          expect(res.status).to.eq(404);
        });
      });
    });

    it("deve retornar 404 ao deletar ID inexistente", () => {
      cy.request({ method: "DELETE", url: "/api/todos/999999", failOnStatusCode: false }).then((res) => {
        expect(res.status).to.eq(404);
      });
    });
  });

  // ── DELETE /api/todos (limpar concluídas) ───────────────────────────────────
  describe("DELETE /api/todos — Limpar tarefas concluídas", () => {
    it("deve remover apenas tarefas concluídas", () => {
      cy.request("POST", "/api/todos", { text: "Pendente 1" });
      cy.request("POST", "/api/todos", { text: "Concluída 1" }).then((r) => {
        cy.request("PUT", `/api/todos/${r.body.id}`, { done: true });
      });
      cy.request("DELETE", "/api/todos").then((res) => {
        expect(res.status).to.eq(200);
        cy.request("GET", "/api/todos").then((todos) => {
          todos.body.forEach((t) => expect(t.done).to.be.false);
        });
      });
    });
  });

  // ── Health check ────────────────────────────────────────────────────────────
  describe("GET /health", () => {
    it("deve retornar status ok", () => {
      cy.request("GET", "/health").then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.status).to.eq("ok");
      });
    });
  });
});
