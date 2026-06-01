/**
 * Todo App - Backend Server
 * Uses Node.js built-in `http` module (no external dependencies required)
 * REST API: GET/POST/PUT/DELETE /api/todos
 */

const http = require("http");
const path = require("path");
const fs = require("fs");
const url = require("url");

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, "../frontend");

// ─── In-memory store ────────────────────────────────────────────────────────
let todos = [];
let nextId = 1;

// ─── CORS headers helper ─────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ─── JSON response helpers ───────────────────────────────────────────────────
function sendJSON(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJSON(res, status, { error: message });
}

// ─── Body parser ─────────────────────────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

// ─── Static file server ──────────────────────────────────────────────────────
const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mimeType = MIME_TYPES[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
    } else {
      res.writeHead(200, { "Content-Type": mimeType });
      res.end(data);
    }
  });
}

// ─── API route handlers ───────────────────────────────────────────────────────
const apiHandlers = {
  // GET /api/todos  or  GET /api/todos?status=pending|done
  GET: (req, res, id, query) => {
    if (id !== null) {
      const todo = todos.find((t) => t.id === id);
      return todo ? sendJSON(res, 200, todo) : sendError(res, 404, "Todo not found");
    }
    let result = [...todos];
    if (query.status === "pending") result = result.filter((t) => !t.done);
    if (query.status === "done") result = result.filter((t) => t.done);
    sendJSON(res, 200, result);
  },

  // POST /api/todos
  POST: async (req, res) => {
    try {
      const body = await parseBody(req);
      const text = (body.text || "").trim();
      if (!text) return sendError(res, 400, "text is required");
      if (text.length > 200) return sendError(res, 400, "text must be ≤ 200 chars");
      const todo = { id: nextId++, text, done: false, createdAt: new Date().toISOString() };
      todos.push(todo);
      sendJSON(res, 201, todo);
    } catch (e) {
      sendError(res, 400, e.message);
    }
  },

  // PUT /api/todos/:id
  PUT: async (req, res, id) => {
    if (id === null) return sendError(res, 400, "id required");
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return sendError(res, 404, "Todo not found");
    try {
      const body = await parseBody(req);
      if (body.text !== undefined) {
        const text = body.text.trim();
        if (!text) return sendError(res, 400, "text cannot be empty");
        if (text.length > 200) return sendError(res, 400, "text must be ≤ 200 chars");
        todos[idx].text = text;
      }
      if (body.done !== undefined) todos[idx].done = Boolean(body.done);
      sendJSON(res, 200, todos[idx]);
    } catch (e) {
      sendError(res, 400, e.message);
    }
  },

  // DELETE /api/todos/:id  or  DELETE /api/todos  (clear all done)
  DELETE: (req, res, id) => {
    if (id !== null) {
      const before = todos.length;
      todos = todos.filter((t) => t.id !== id);
      if (todos.length === before) return sendError(res, 404, "Todo not found");
      sendJSON(res, 200, { message: "Deleted", id });
    } else {
      todos = todos.filter((t) => !t.done);
      sendJSON(res, 200, { message: "Cleared completed todos" });
    }
  },
};

// ─── Main request handler ─────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res);

  // Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query = parsed.query;

  // ── API routes ──
  if (pathname.startsWith("/api/todos")) {
    const parts = pathname.split("/").filter(Boolean); // ['api','todos', optionalId]
    const rawId = parts[2];
    const id = rawId !== undefined ? parseInt(rawId, 10) : null;
    if (rawId !== undefined && isNaN(id)) return sendError(res, 400, "Invalid id");

    const handler = apiHandlers[req.method];
    if (!handler) return sendError(res, 405, "Method not allowed");
    return handler(req, res, id, query);
  }

  // ── Reset (só para testes) ──
  if (pathname === "/test/reset" && req.method === "POST") {
    resetStore();
    return sendJSON(res, 200, { message: "Store resetado" });
  }

  // ── Health check ──
  if (pathname === "/health") {
    return sendJSON(res, 200, { status: "ok", todos: todos.length });
  }

  // ── Static files ──
  let filePath;
  if (pathname === "/" || pathname === "/index.html") {
    filePath = path.join(FRONTEND_DIR, "index.html");
  } else {
    filePath = path.join(FRONTEND_DIR, pathname);
  }
  serveStatic(res, filePath);
});

// ─── Export helpers for unit tests ───────────────────────────────────────────
function resetStore() {
  todos = [];
  nextId = 1;
}

function getStore() {
  return todos;
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀  Todo API running at http://localhost:${PORT}`);
    console.log(`   Frontend : http://localhost:${PORT}/`);
    console.log(`   API      : http://localhost:${PORT}/api/todos`);
    console.log(`   Health   : http://localhost:${PORT}/health`);
  });
}

module.exports = { server, resetStore, getStore };
