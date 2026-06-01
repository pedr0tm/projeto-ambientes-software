# TAREFAS — Gerenciador de Tarefas

Aplicação web full-stack com **Express.js** no backend, **HTML/CSS/JS puro** no frontend e **Cypress** para testes end-to-end.

---

## Estrutura do Projeto

```
todo-app/
├── backend/
│   └── server.js           # Servidor HTTP + API REST (sem dependências externas*)
├── frontend/
│   ├── index.html          # Interface principal
│   ├── style.css           # Estilos (tema industrial/brutalist)
│   └── app.js              # Lógica do frontend (fetch API)
├── cypress/
│   ├── e2e/
│   │   ├── api.cy.js       # Testes da API backend (21 testes)
│   │   └── frontend.cy.js  # Testes de interface UI (24 testes)
│   └── support/
│       └── e2e.js          # Comandos customizados + hooks globais
├── cypress.config.js
└── package.json
```

> \* O `backend/server.js` usa **apenas módulos nativos do Node.js** (`http`, `fs`, `path`, `url`).  
> Express está listado nas dependências mas **não é obrigatório** para rodar o servidor básico.

---

## Instalação

```bash
cd todo-app
npm install
```

---

## Rodar o servidor

```bash
npm start
# ou
node backend/server.js
```

Acesse: http://localhost:3000

---

## API REST

| Método | Rota                  | Descrição                         |
|--------|-----------------------|-----------------------------------|
| GET    | `/api/todos`          | Listar todas (aceita `?status=pending\|done`) |
| GET    | `/api/todos/:id`      | Buscar tarefa por ID              |
| POST   | `/api/todos`          | Criar tarefa `{ text: string }`   |
| PUT    | `/api/todos/:id`      | Editar tarefa `{ text?, done? }`  |
| DELETE | `/api/todos/:id`      | Remover tarefa                    |
| DELETE | `/api/todos`          | Limpar todas as concluídas        |
| GET    | `/health`             | Status do servidor                |

---

## Testes com Cypress

### Pré-requisito
O servidor precisa estar rodando (`npm start`) antes de executar os testes.

### Rodar todos os testes (modo headless)
```bash
npm test
```

### Abrir interface visual do Cypress
```bash
npm run test:open
```

### Testar só a API (backend)
```bash
npm run test:api
```

### Testar só o Frontend (UI)
```bash
npm run test:frontend
```

---

## Testes cobertos

### `api.cy.js` — Backend (21 testes)
- **POST** — criar com texto válido, erro em texto vazio, sem campo `text`, texto > 200 chars
- **GET** — listar todas, filtrar por `?status=pending`, filtrar por `?status=done`
- **GET/:id** — buscar por ID existente, 404 para inexistente, 400 para ID inválido
- **PUT** — atualizar texto, marcar como feita, desmarcar, 404 para inexistente, 400 texto vazio
- **DELETE/:id** — remover existente, 404 para inexistente
- **DELETE** — limpar concluídas mantendo pendentes
- **Health** — endpoint `/health` retorna `{ status: "ok" }`

### `frontend.cy.js` — Frontend (24 testes)
- Carregamento inicial da página e elementos visíveis
- Adicionar tarefa por botão, por Enter, limpar input, esconder empty state
- Erros de validação e contador de caracteres
- Marcar/desmarcar tarefas como concluídas
- Filtros: Todas / Pendentes / Concluídas + destaque do filtro ativo
- Editar via modal: abrir, preencher, salvar, cancelar, fechar (X, Escape)
- Remover tarefa individual, mostrar empty state na última
- Limpar concluídas mantendo pendentes
- Contadores de stats: total, pendentes, concluídas

---

## Funcionalidades da Aplicação

- ✅ Criar, editar, concluir e excluir tarefas
- 🔍 Filtrar por status (todas / pendentes / concluídas)
- 🗑️ Limpar todas as tarefas concluídas de uma vez
- 📊 Contadores de tarefas em tempo real no header
- ✏️ Edição em modal com atalhos de teclado (Enter / Escape)
- 🔔 Notificações toast para feedback de ações
- 📱 Design responsivo para mobile
- 💾 Dados persistidos em memória no servidor
