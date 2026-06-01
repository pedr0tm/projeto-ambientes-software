/**
 * TAREFAS — Frontend App Logic
 * Pure vanilla JS, no dependencies
 * Communicates with the Express backend via fetch()
 */

const API_BASE = "/api/todos";

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  todos: [],
  filter: "all",
  editingId: null,
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const todoInput    = $("todo-input");
const btnAdd       = $("btn-add");
const todoList     = $("todo-list");
const emptyState   = $("empty-state");
const charCounter  = $("char-counter");
const errorMsg     = $("error-msg");
const countTotal   = $("count-total");
const countPending = $("count-pending");
const countDone    = $("count-done");
const filterBtns   = document.querySelectorAll(".filter-btn");
const btnClear     = $("btn-clear");
const modalOverlay = $("modal-overlay");
const editInput    = $("edit-input");
const btnSave      = $("btn-save");
const btnCancel    = $("btn-cancel");
const modalClose   = $("modal-close");
const toast        = $("toast");

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const defaults = { headers: { "Content-Type": "application/json" } };
  const res = await fetch(path, { ...defaults, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro na requisição");
  return data;
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderList() {
  const filtered = state.todos.filter((t) => {
    if (state.filter === "pending") return !t.done;
    if (state.filter === "done") return t.done;
    return true;
  });

  todoList.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.add("visible");
  } else {
    emptyState.classList.remove("visible");
    filtered.forEach((todo) => {
      todoList.appendChild(createTodoEl(todo));
    });
  }

  updateStats();
}

function createTodoEl(todo) {
  const li = document.createElement("li");
  li.className = `todo-item${todo.done ? " done" : ""}`;
  li.dataset.id = todo.id;
  li.dataset.testid = `todo-item-${todo.id}`;

  const date = new Date(todo.createdAt);
  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  li.innerHTML = `
    <input
      type="checkbox"
      class="todo-check"
      aria-label="Marcar como ${todo.done ? "pendente" : "concluída"}"
      data-testid="check-${todo.id}"
      ${todo.done ? "checked" : ""}
    />
    <span class="todo-text" data-testid="text-${todo.id}">${escapeHtml(todo.text)}</span>
    <span class="todo-meta">${dateStr}</span>
    <div class="todo-actions">
      <button class="btn-icon-action btn-edit" data-testid="edit-${todo.id}" title="Editar" aria-label="Editar tarefa">✎</button>
      <button class="btn-icon-action btn-delete" data-testid="delete-${todo.id}" title="Excluir" aria-label="Excluir tarefa">✕</button>
    </div>
  `;

  // Checkbox toggle
  li.querySelector(".todo-check").addEventListener("change", () => toggleTodo(todo.id, !todo.done));

  // Text click → edit
  li.querySelector(".todo-text").addEventListener("click", () => openModal(todo.id, todo.text));

  // Edit button
  li.querySelector(".btn-edit").addEventListener("click", () => openModal(todo.id, todo.text));

  // Delete button
  li.querySelector(".btn-delete").addEventListener("click", () => deleteTodo(todo.id, li));

  return li;
}

function updateStats() {
  const total = state.todos.length;
  const done = state.todos.filter((t) => t.done).length;
  const pending = total - done;
  countTotal.textContent = total;
  countDone.textContent = done;
  countPending.textContent = pending;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── CRUD actions ─────────────────────────────────────────────────────────────
async function loadTodos() {
  try {
    state.todos = await apiFetch(API_BASE);
    renderList();
  } catch (e) {
    showToast("Erro ao carregar tarefas", "error");
  }
}

async function addTodo() {
  const text = todoInput.value.trim();
  setError("");

  if (!text) {
    setError("Digite o texto da tarefa.");
    todoInput.focus();
    return;
  }
  if (text.length > 200) {
    setError("Texto muito longo (máx. 200 caracteres).");
    return;
  }

  try {
    btnAdd.disabled = true;
    const todo = await apiFetch(API_BASE, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    state.todos.unshift(todo);
    todoInput.value = "";
    updateCharCounter();
    renderList();
    showToast("Tarefa adicionada!", "success");
  } catch (e) {
    setError(e.message);
  } finally {
    btnAdd.disabled = false;
  }
}

async function toggleTodo(id, done) {
  try {
    const updated = await apiFetch(`${API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify({ done }),
    });
    const idx = state.todos.findIndex((t) => t.id === id);
    if (idx !== -1) state.todos[idx] = updated;
    renderList();
  } catch (e) {
    showToast("Erro ao atualizar tarefa", "error");
  }
}

async function deleteTodo(id, el) {
  el.classList.add("removing");
  await new Promise((r) => setTimeout(r, 200));
  try {
    await apiFetch(`${API_BASE}/${id}`, { method: "DELETE" });
    state.todos = state.todos.filter((t) => t.id !== id);
    renderList();
    showToast("Tarefa removida", "success");
  } catch (e) {
    el.classList.remove("removing");
    showToast("Erro ao remover tarefa", "error");
  }
}

async function saveEdit() {
  const text = editInput.value.trim();
  if (!text) return;
  if (text.length > 200) {
    showToast("Texto muito longo", "error");
    return;
  }
  try {
    const updated = await apiFetch(`${API_BASE}/${state.editingId}`, {
      method: "PUT",
      body: JSON.stringify({ text }),
    });
    const idx = state.todos.findIndex((t) => t.id === state.editingId);
    if (idx !== -1) state.todos[idx] = updated;
    closeModal();
    renderList();
    showToast("Tarefa atualizada!", "success");
  } catch (e) {
    showToast("Erro ao editar tarefa", "error");
  }
}

async function clearCompleted() {
  if (!state.todos.some((t) => t.done)) {
    showToast("Nenhuma tarefa concluída para limpar", "error");
    return;
  }
  try {
    await apiFetch(API_BASE, { method: "DELETE" });
    state.todos = state.todos.filter((t) => !t.done);
    renderList();
    showToast("Concluídas removidas!", "success");
  } catch (e) {
    showToast("Erro ao limpar", "error");
  }
}

// ─── Filter ───────────────────────────────────────────────────────────────────
function setFilter(filter) {
  state.filter = filter;
  filterBtns.forEach((b) => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  renderList();
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(id, text) {
  state.editingId = id;
  editInput.value = text;
  modalOverlay.classList.add("open");
  setTimeout(() => editInput.focus(), 100);
}

function closeModal() {
  modalOverlay.classList.remove("open");
  state.editingId = null;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = "success") {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setError(msg) {
  errorMsg.textContent = msg;
}

function updateCharCounter() {
  const len = todoInput.value.length;
  charCounter.textContent = `${len} / 200`;
  charCounter.classList.toggle("warn", len > 180);
}

// ─── Event listeners ──────────────────────────────────────────────────────────
btnAdd.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

todoInput.addEventListener("input", updateCharCounter);

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

btnClear.addEventListener("click", clearCompleted);

btnSave.addEventListener("click", saveEdit);
btnCancel.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

editInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveEdit();
  if (e.key === "Escape") closeModal();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
loadTodos();
