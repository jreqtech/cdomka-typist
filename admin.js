const COMPETITION_TEXT_KEY = "cdomkaCompetitionTexts";
const defaultTexts = (window.CDOMKA_COMPETITION_QUOTES || [])
  .filter((quote) => quote.category === "anime" && quote.size === "thicc")
  .map(normalizeQuote);

const textListEl = document.getElementById("textList");
const textForm = document.getElementById("textForm");
const titleInput = document.getElementById("titleInput");
const bodyInput = document.getElementById("bodyInput");
const addTextButton = document.getElementById("addText");
const deleteTextButton = document.getElementById("deleteText");
const resetTextsButton = document.getElementById("resetTexts");
const statusEl = document.getElementById("status");

let texts = loadTexts();
let selectedId = texts[0]?.id || null;

function normalizeQuote(quote) {
  return {
    id: quote.id || createId(),
    title: quote.title || "Untitled",
    text: quote.text || "",
    source: "Anime Debate Topic",
    category: "anime",
    size: "thicc"
  };
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `text-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTexts() {
  try {
    const saved = JSON.parse(localStorage.getItem(COMPETITION_TEXT_KEY));
    if (Array.isArray(saved) && saved.length) return saved.map(normalizeQuote);
  } catch {
    return defaultTexts;
  }

  return defaultTexts;
}

function saveTexts() {
  localStorage.setItem(COMPETITION_TEXT_KEY, JSON.stringify(texts));
  setStatus("saved locally");
}

function setStatus(message) {
  statusEl.textContent = message;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    statusEl.textContent = "local competition text";
  }, 1800);
}

function renderList() {
  textListEl.innerHTML = "";

  texts.forEach((quote) => {
    const button = document.createElement("button");
    button.className = "admin-list-item";
    button.type = "button";
    button.classList.toggle("active", quote.id === selectedId);
    button.innerHTML = `
      <strong>${escapeHtml(quote.title)}</strong>
      <small>${quote.text.length} chars</small>
    `;
    button.addEventListener("click", () => {
      selectedId = quote.id;
      render();
    });
    textListEl.appendChild(button);
  });
}

function renderEditor() {
  const selected = texts.find((quote) => quote.id === selectedId);
  titleInput.value = selected?.title || "";
  bodyInput.value = selected?.text || "";
  deleteTextButton.disabled = !selected;
}

function render() {
  renderList();
  renderEditor();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

addTextButton.addEventListener("click", () => {
  const quote = normalizeQuote({
    title: "New Debate Topic",
    text: "Type the competition paragraph here."
  });
  texts.push(quote);
  selectedId = quote.id;
  saveTexts();
  render();
  titleInput.focus();
  titleInput.select();
});

textForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = texts.find((quote) => quote.id === selectedId);
  if (!selected) return;

  selected.title = titleInput.value.trim() || "Untitled";
  selected.text = bodyInput.value.trim();
  saveTexts();
  render();
});

deleteTextButton.addEventListener("click", () => {
  const selected = texts.find((quote) => quote.id === selectedId);
  if (!selected) return;
  if (!confirm(`Delete "${selected.title}"?`)) return;

  texts = texts.filter((quote) => quote.id !== selectedId);
  selectedId = texts[0]?.id || null;
  saveTexts();
  render();
});

resetTextsButton.addEventListener("click", () => {
  if (!confirm("Reset competition text to the built-in defaults on this browser?")) return;
  texts = defaultTexts.map(normalizeQuote);
  selectedId = texts[0]?.id || null;
  saveTexts();
  render();
});

render();
