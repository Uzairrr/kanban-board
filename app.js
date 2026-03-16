const COLUMNS = [
  { id: "todo",       label: "To Do",       dot: "#64748b" },
  { id: "inprogress", label: "In Progress",  dot: "#f59e0b" },
  { id: "done",       label: "Done",         dot: "#22c55e" },
];

const DEFAULT_CARDS = {
  todo: [
    { id: "c1", text: "Design landing page layout" },
    { id: "c2", text: "Set up database schema" },
    { id: "c3", text: "Write unit tests" },
  ],
  inprogress: [
    { id: "c4", text: "Build authentication flow" },
    { id: "c5", text: "Integrate payment API" },
  ],
  done: [
    { id: "c6", text: "Initial project setup" },
    { id: "c7", text: "Create component library" },
  ],
};

let cards    = loadCards();
let dragId   = null;
let dragFrom = null;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function loadCards() {
  try {
    return JSON.parse(localStorage.getItem("kanban-cards")) || DEFAULT_CARDS;
  } catch {
    return DEFAULT_CARDS;
  }
}

function saveCards() {
  localStorage.setItem("kanban-cards", JSON.stringify(cards));
}

function updateHeader() {
  const total = Object.values(cards).flat().length;
  const done  = cards.done.length;
  document.getElementById("countLabel").textContent    = `${done} / ${total} tasks completed`;
  document.getElementById("progressFill").style.width  = total ? `${(done / total) * 100}%` : "0%";
}

function render() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  COLUMNS.forEach((col) => {
    const colEl = document.createElement("div");
    colEl.className  = "column";
    colEl.dataset.col = col.id;
    colEl.innerHTML  = `
      <div class="col-header">
        <div class="col-title">
          <span class="col-dot" style="background:${col.dot}"></span>
          <span class="col-name">${col.label}</span>
        </div>
        <span class="col-count">${cards[col.id].length}</span>
      </div>
      <div class="cards" id="cards-${col.id}"></div>
      <div class="add-form" id="form-${col.id}">
        <textarea rows="2" placeholder="Task description..."></textarea>
        <div class="add-btns">
          <button class="btn-confirm" style="background:${col.dot}" data-col="${col.id}">Add</button>
          <button class="btn-cancel" data-col="${col.id}">Cancel</button>
        </div>
      </div>
      <button class="btn-new-card" data-col="${col.id}">+ Add card</button>`;

    // Column drag events
    colEl.addEventListener("dragover",  (e) => { e.preventDefault(); colEl.classList.add("drag-over"); });
    colEl.addEventListener("dragleave", ()  => colEl.classList.remove("drag-over"));
    colEl.addEventListener("drop",      ()  => { colEl.classList.remove("drag-over"); dropCard(col.id); });

    board.appendChild(colEl);

    // Render cards
    const cardsEl = document.getElementById(`cards-${col.id}`);
    cards[col.id].forEach((card) => {
      const el = document.createElement("div");
      el.className   = "card";
      el.draggable   = true;
      el.dataset.id  = card.id;
      el.dataset.col = col.id;
      el.innerHTML   = `<span class="card-text">${card.text}</span><button class="delete-btn" data-id="${card.id}" data-col="${col.id}">×</button>`;

      el.addEventListener("dragstart", () => { dragId = card.id; dragFrom = col.id; el.classList.add("dragging"); });
      el.addEventListener("dragend",   () => el.classList.remove("dragging"));

      cardsEl.appendChild(el);
    });

    // Button events (delegated after render)
    colEl.querySelector(".btn-new-card").addEventListener("click", () => openForm(col.id));
    colEl.querySelector(".btn-confirm").addEventListener("click",  () => addCard(col.id));
    colEl.querySelector(".btn-cancel").addEventListener("click",   () => closeForm(col.id));

    // Keyboard shortcuts in textarea
    const ta = colEl.querySelector("textarea");
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addCard(col.id); }
      if (e.key === "Escape") closeForm(col.id);
    });

    // Delete buttons
    colEl.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteCard(btn.dataset.col, btn.dataset.id));
    });
  });

  updateHeader();
}

function openForm(colId) {
  document.getElementById(`form-${colId}`).style.display = "block";
  document.getElementById(`form-${colId}`).querySelector("textarea").focus();
}

function closeForm(colId) {
  const form = document.getElementById(`form-${colId}`);
  form.querySelector("textarea").value = "";
  form.style.display = "none";
}

function addCard(colId) {
  const ta   = document.getElementById(`form-${colId}`).querySelector("textarea");
  const text = ta.value.trim();
  if (!text) return;
  cards[colId].push({ id: uid(), text });
  saveCards();
  render();
  closeForm(colId);
}

function deleteCard(colId, id) {
  cards[colId] = cards[colId].filter((c) => c.id !== id);
  saveCards();
  render();
}

function dropCard(toCol) {
  if (!dragId || dragFrom === toCol) return;
  const card = cards[dragFrom].find((c) => c.id === dragId);
  if (!card) return;
  cards[dragFrom] = cards[dragFrom].filter((c) => c.id !== dragId);
  cards[toCol].push(card);
  dragId   = null;
  dragFrom = null;
  saveCards();
  render();
}

render();
