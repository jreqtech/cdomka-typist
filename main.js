const wordsEl = document.getElementById("words");
const inputEl = document.getElementById("typingInput");
const playerNameEl = document.getElementById("playerName");
const nameForm = document.getElementById("nameForm");
const saveScoreButton = document.getElementById("saveScoreButton");
const repeatButton = document.getElementById("repeatButton");
const nextButton = document.getElementById("nextButton");
const leaderboardButton = document.getElementById("leaderboardButton");
const leaderboardDialog = document.getElementById("leaderboardDialog");
const closeLeaderboardButton = document.getElementById("closeLeaderboard");
const clearScoresButton = document.getElementById("clearScores");
const leaderboardEl = document.getElementById("leaderboard");
const timerEl = document.getElementById("timer");
const resultEl = document.getElementById("result");
const resultWpmEl = document.getElementById("resultWpm");
const resultAccuracyEl = document.getElementById("resultAccuracy");
const resultScoreEl = document.getElementById("resultScore");
const resultRankEl = document.getElementById("resultRank");
const resultRankTitleEl = document.getElementById("resultRankTitle");
const resultRankCardEl = resultRankEl.closest(".rank-display");
const quoteSourceEl = document.getElementById("quoteSource");
const focusButton = document.getElementById("focusButton");
const caretEl = document.getElementById("caret");

const STORAGE_KEY = "cdomkaTypingLeaderboard";
const COMPETITION_TEXT_KEY = "cdomkaCompetitionTexts";
const IDLE_TIMEOUT_MS = 5000;

const wordBank = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for",
  "they", "I", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you",
  "do", "but", "from", "or", "which", "one", "would", "all", "will", "there",
  "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other",
  "so", "what", "time", "up", "go", "about", "than", "into", "could", "state",
  "only", "new", "year", "some", "take", "come", "these", "know", "see", "use",
  "get", "like", "then", "first", "any", "work", "now", "may", "such", "give",
  "over", "think", "most", "even", "find", "day", "also", "after", "way", "many",
  "must", "look", "before", "great", "back", "through", "long", "where", "much",
  "should", "well", "people", "down", "own", "just", "because", "good", "each",
  "those", "feel", "seem", "how", "high", "too", "place", "little", "world",
  "very", "still", "nation", "hand", "old", "life", "tell", "write", "become",
  "here", "show", "house", "both", "between", "need", "mean", "call", "develop",
  "under", "last", "right", "move", "thing", "general", "school", "never",
  "same", "another", "begin", "while", "number", "part", "turn", "real", "leave",
  "might", "want", "point", "form", "off", "child", "few", "small", "since",
  "against", "ask", "late", "home", "interest", "large", "person", "end", "open",
  "public", "follow", "during", "present", "without", "again", "hold", "govern",
  "around", "possible", "head", "consider", "word", "program", "problem",
  "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep",
  "face", "fact", "group", "play", "stand", "increase", "early", "course",
  "change", "help", "line"
];

let wordQueue = [];
let charSpans = [];
let renderedTarget = "";
let previousTyped = "";
let extraCharsByIndex = new Map();
let extraSpansByIndex = new Map();
let lastCompetitionTitle = "";
let competitionBags = new Map();
let monkeytypeQuotes = [];
let monkeytypeQuotesLoading = null;
const competitionQuotes = window.CDOMKA_COMPETITION_QUOTES || [];
const quoteGroups = {
  short: [0, 100],
  medium: [101, 300],
  long: [301, 600],
  thicc: [601, 9999]
};

const rankTitles = {
  "S+": [
    "TYPING FINAL BOSS",
    "HUMAN AUTOCOMPLETE",
    "KEYBOARD DEITY",
    "UNLIMITED WPM",
    "MAIN CHARACTER FINGERS",
    "BUILT DIFFERENT"
  ],
  S: [
    "SPEED DEMON",
    "KEYBOARD BERSERKER",
    "TURBO TYPIST",
    "FINGERS OF FURY",
    "MECHANICAL MENACE",
    "CLACK AND ATTACK"
  ],
  A: [
    "KEYBOARD WARRIOR",
    "CONTROVERSIAL TAKE SURVIVOR",
    "ANIME OPINION DEFENDER",
    "POWERSCALING DEBATER",
    "PLOT ARMOR ACTIVATED",
    "CERTIFIED TYPIST"
  ],
  B: [
    "FAST FINGERS",
    "FILLER ARC SURVIVOR",
    "SWITCH HITTER",
    "TYPING TOURNAMENT ARC",
    "RESPECTABLE BUTTON PRESSER",
    "ABOVE-AVERAGE PROTAGONIST"
  ],
  C: [
    "WARMING UP",
    "TUTORIAL ARC COMPLETE",
    "GETTING THE HANG OF IT",
    "CAREFUL CLICKER",
    "ONE KEY AT A TIME",
    "TRAINING MONTAGE ACTIVE"
  ],
  D: [
    "BACKSPACE ENJOYER",
    "TWO-FINGER TECHNIQUE",
    "TYPING LICENSE PENDING",
    "CAPS LOCK MAIN",
    "STILL BUFFERING",
    "KEYBOARD CASUALTY"
  ],
  F: [
    "DEFEATED BY THE PARAGRAPH",
    "HUNT AND PECK HERO",
    "SPACEBAR SPECIALIST",
    "KEYBOARD DISCONNECTED",
    "RAGE QUIT CANDIDATE",
    "TUTORIAL BOSS VICTIM"
  ]
};

const state = {
  mode: "time",
  options: {
    time: 15,
    words: 10,
    quote: "random",
    competition: "thicc",
    competitionTime: 15
  },
  targetText: "",
  startedAt: null,
  timer: null,
  finished: false,
  lastStats: null,
  ready: false,
  pendingScore: null
  ,
  currentQuoteSource: "",
  awaitingCompetitionStart: false,
  preserveTarget: false,
  keyPresses: 0,
  correctKeyPresses: 0,
  lastInputAt: null
};

function isCompetitionTimed() {
  return state.mode === "competition" && Number.isFinite(state.options.competitionTime);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function nextWord(previousWord) {
  if (!wordQueue.length) wordQueue = shuffle(wordBank);

  if (wordQueue[0] === previousWord && wordQueue.length > 1) {
    [wordQueue[0], wordQueue[1]] = [wordQueue[1], wordQueue[0]];
  }

  return wordQueue.shift();
}

function buildWords(count) {
  const words = [];
  let previousWord = "";

  for (let i = 0; i < count; i += 1) {
    const word = nextWord(previousWord);
    words.push(word);
    previousWord = word;
  }

  return words.join(" ");
}

function pickQuote(size) {
  const pool = size === "random"
    ? monkeytypeQuotes
    : monkeytypeQuotes.filter((quote) => {
      const [min, max] = quoteGroups[size];
      return quote.length >= min && quote.length <= max;
    });

  return randomItem(pool).text;
}

function loadMonkeytypeQuotes() {
  if (monkeytypeQuotes.length) return Promise.resolve(monkeytypeQuotes);
  if (window.MONKEYTYPE_QUOTES_ENGLISH?.quotes?.length) {
    monkeytypeQuotes = window.MONKEYTYPE_QUOTES_ENGLISH.quotes;
    return Promise.resolve(monkeytypeQuotes);
  }
  if (monkeytypeQuotesLoading) return monkeytypeQuotesLoading;

  monkeytypeQuotesLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "mt-english-data.js";
    script.onload = () => {
      monkeytypeQuotes = window.MONKEYTYPE_QUOTES_ENGLISH?.quotes || [];
      resolve(monkeytypeQuotes);
    };
    script.onerror = () => reject(new Error("Unable to load Monkeytype quotes."));
    document.body.appendChild(script);
  });

  return monkeytypeQuotesLoading;
}

function pickCompetitionQuote(size = "medium") {
  const localCompetitionQuotes = getCompetitionQuotes();
  const pool = localCompetitionQuotes.filter((quote) => {
    return quote.category === "anime" && quote.size === size;
  });
  const selectedPool = pool.length ? pool : localCompetitionQuotes;
  const quote = nextCompetitionBagItem(size, selectedPool);

  lastCompetitionTitle = quote.title || "";
  return quote;
}

function nextCompetitionBagItem(size, pool) {
  const signature = pool.map((quote) => quote.title || quote.text).join("|");
  let bag = competitionBags.get(size);

  if (!bag || bag.signature !== signature || !bag.queue.length) {
    const queue = shuffle(pool);
    if (queue.length > 1 && (queue[0].title || "") === lastCompetitionTitle) {
      [queue[0], queue[1]] = [queue[1], queue[0]];
    }
    bag = { signature, queue };
    competitionBags.set(size, bag);
  }

  return bag.queue.shift();
}

function getCompetitionQuotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(COMPETITION_TEXT_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    return competitionQuotes;
  }

  return competitionQuotes;
}

function configureTest() {
  document.body.dataset.mode = state.mode;

  if (state.preserveTarget && state.targetText) {
    updateTimerLabel();
    setCompetitionAwaiting(state.mode === "competition");
    state.preserveTarget = false;
    return;
  }

  if (state.mode === "time") {
    setCompetitionAwaiting(false);
    state.targetText = buildWords(160);
    state.currentQuoteSource = "";
    timerEl.textContent = state.options.time;
  }

  if (state.mode === "words") {
    setCompetitionAwaiting(false);
    state.targetText = buildWords(state.options.words);
    state.currentQuoteSource = "";
    timerEl.textContent = "words";
  }

  if (state.mode === "quote") {
    setCompetitionAwaiting(false);
    if (!monkeytypeQuotes.length) {
      state.targetText = "loading quotes";
      inputEl.disabled = true;
      loadMonkeytypeQuotes().then(() => {
        if (state.mode === "quote" && !state.startedAt && !state.finished) resetTest();
      });
      return;
    }

    inputEl.disabled = false;
    state.targetText = pickQuote(state.options.quote);
    state.currentQuoteSource = "";
    timerEl.textContent = state.options.quote;
  }

  if (state.mode === "competition") {
    const quote = pickCompetitionQuote(state.options.competition);
    state.targetText = quote.text;
    state.currentQuoteSource = "";
    timerEl.textContent = isCompetitionTimed() ? state.options.competitionTime : "full";
    setCompetitionAwaiting(true);
  }
}

function updateTimerLabel() {
  if (state.mode === "time") timerEl.textContent = state.options.time;
  if (state.mode === "words") timerEl.textContent = "words";
  if (state.mode === "quote") timerEl.textContent = state.options.quote;
  if (state.mode === "competition") timerEl.textContent = isCompetitionTimed() ? state.options.competitionTime : "full";
}

function setCompetitionAwaiting(value) {
  state.awaitingCompetitionStart = value;
  document.body.classList.toggle("awaiting-start", value);
}

function getScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveScores(scores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
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

function calculateStats() {
  const typed = inputEl.value;
  const target = state.targetText;
  let correctChars = 0;
  const extraCharCount = countExtraChars();
  let errors = extraCharCount;

  for (let i = 0; i < typed.length; i += 1) {
    if (typed[i] === target[i]) {
      correctChars += 1;
    } else {
      errors += 1;
    }
  }

  const totalTypedChars = typed.length + extraCharCount;
  const elapsedSeconds = state.startedAt ? Math.max((Date.now() - state.startedAt) / 1000, 1) : 1;
  const grossWpm = totalTypedChars / 5 / (elapsedSeconds / 60);
  const accuracy = state.keyPresses ? (state.correctKeyPresses / state.keyPresses) * 100 : 0;
  const score = grossWpm * (accuracy / 100);

  return {
    typed,
    totalTypedChars,
    correctChars,
    errors,
    keyPresses: state.keyPresses,
    correctKeyPresses: state.correctKeyPresses,
    elapsedSeconds,
    wpm: Math.round(grossWpm),
    accuracy: Math.round(accuracy),
    score: Math.round(score)
  };
}

function renderWords() {
  const typed = inputEl.value;
  const target = state.targetText;

  if (renderedTarget !== target) {
    renderTargetCharacters(target);
  }

  updateTypedCharacters(previousTyped, typed, target);
  previousTyped = typed;
  const didScroll = scrollCurrentCharacterIntoView();
  positionCaret();
  if (didScroll) requestAnimationFrame(positionCaret);
}

function renderTargetCharacters(target) {
  const fragment = document.createDocumentFragment();
  charSpans = [];
  extraCharsByIndex = new Map();
  extraSpansByIndex = new Map();
  renderedTarget = target;
  previousTyped = "";
  wordsEl.textContent = "";

  for (let i = 0; i < target.length; i += 1) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = target[i];
    charSpans.push(span);
    fragment.appendChild(span);
  }

  wordsEl.appendChild(fragment);
}

function updateTypedCharacters(previous, typed, target) {
  const firstChanged = findFirstChangedIndex(previous, typed);
  const start = Math.max(0, Math.min(firstChanged, previous.length, typed.length) - 1);
  const end = Math.min(target.length - 1, Math.max(previous.length, typed.length) + 1);

  for (let i = start; i <= end; i += 1) {
    renderExtraCharacters(i);
    updateCharacterClass(i, typed, target);
  }
}

function findFirstChangedIndex(previous, typed) {
  const max = Math.min(previous.length, typed.length);
  for (let i = 0; i < max; i += 1) {
    if (previous[i] !== typed[i]) return i;
  }
  return max;
}

function updateCharacterClass(index, typed, target) {
  const span = charSpans[index];
  if (!span) return;

  let className = "char";
  span.textContent = target[index];

  if (index < typed.length) {
    const isCorrect = typed[index] === target[index];
    className += isCorrect ? " correct" : " incorrect";
  }

  if (index === typed.length && !state.finished) className += " current";
  span.className = className;
}

function renderExtraCharacters(index) {
  extraSpansByIndex.get(index)?.remove();
  extraSpansByIndex.delete(index);

  const extraChars = extraCharsByIndex.get(index);
  if (!extraChars || !charSpans[index]) return;

  const container = document.createElement("span");
  container.className = "extra-cluster";
  for (const char of extraChars) {
    const span = document.createElement("span");
    span.className = "char incorrect extra-before-space";
    span.textContent = char;
    container.appendChild(span);
  }

  charSpans[index].before(container);
  extraSpansByIndex.set(index, container);
}

function countExtraChars() {
  let count = 0;
  extraCharsByIndex.forEach((chars) => {
    count += chars.length;
  });
  return count;
}

function recordTypedKey(char) {
  const index = inputEl.value.length;
  state.lastInputAt = Date.now();
  state.keyPresses += 1;
  if (state.targetText[index] === char) {
    state.correctKeyPresses += 1;
  }
}

function addExtraCharacterAtCurrentSpace(char) {
  const index = inputEl.value.length;
  if (state.targetText[index] !== " ") return false;

  const existing = extraCharsByIndex.get(index) || "";
  extraCharsByIndex.set(index, existing + char);
  renderExtraCharacters(index);
  updateCharacterClass(index, inputEl.value, state.targetText);
  positionCaret();
  return true;
}

function removeExtraCharacterAtCurrentSpace() {
  const index = inputEl.value.length;
  const existing = extraCharsByIndex.get(index);
  if (!existing) return false;

  const next = existing.slice(0, -1);
  if (next) {
    extraCharsByIndex.set(index, next);
  } else {
    extraCharsByIndex.delete(index);
  }

  renderExtraCharacters(index);
  updateCharacterClass(index, inputEl.value, state.targetText);
  positionCaret();
  return true;
}

function scrollCurrentCharacterIntoView() {
  const current = wordsEl.querySelector(".char.current");
  if (!current) return false;

  const wordsRect = wordsEl.getBoundingClientRect();
  const currentRect = current.getBoundingClientRect();
  const targetTop = wordsRect.top + wordsEl.clientHeight * 0.35;
  const scrollDelta = currentRect.top - targetTop;
  if (Math.abs(scrollDelta) < 1) return false;
  wordsEl.scrollTop += scrollDelta;
  return true;
}

function positionCaret() {
  const current = wordsEl.querySelector(".char.current");
  if (!current || state.finished || state.awaitingCompetitionStart) {
    caretEl.classList.add("hidden");
    return;
  }

  const testRect = document.getElementById("test").getBoundingClientRect();
  const currentRect = current.getBoundingClientRect();
  const x = currentRect.left - testRect.left - 1;
  const y = currentRect.top - testRect.top + currentRect.height * 0.04;

  caretEl.style.height = `${currentRect.height * 1.05}px`;
  caretEl.classList.remove("hidden");
  caretEl.style.opacity = "1";
  caretEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function renderTimer() {
  if (!state.startedAt || state.finished) return;

  if (state.lastInputAt && Date.now() - state.lastInputAt >= IDLE_TIMEOUT_MS) {
    finishTest();
    return;
  }

  if (state.mode !== "time" && !isCompetitionTimed()) return;
  const timeLimit = state.mode === "competition" ? state.options.competitionTime : state.options.time;
  const remaining = Math.max(0, timeLimit - Math.floor((Date.now() - state.startedAt) / 1000));
  timerEl.textContent = remaining;
  if (remaining <= 0) finishTest();
}

function beginTest() {
  if (state.startedAt || state.finished || state.awaitingCompetitionStart) return;
  state.startedAt = Date.now();
  state.lastInputAt = state.startedAt;
  state.timer = setInterval(renderTimer, 200);
  renderTimer();
}

function renderResult(stats) {
  resultWpmEl.textContent = stats.wpm;
  resultAccuracyEl.textContent = `${stats.accuracy}%`;
  resultScoreEl.textContent = stats.score;
  resultRankEl.textContent = stats.rank;
  resultRankEl.dataset.rank = stats.rank;
  resultRankTitleEl.textContent = stats.rankTitle;
  resultRankCardEl.className = `rank-card rank-display ${getRankClass(stats.rank)}`;
  const shouldShowSource = state.mode !== "competition" && state.currentQuoteSource;
  quoteSourceEl.textContent = shouldShowSource ? state.currentQuoteSource : "";
  quoteSourceEl.classList.toggle("hidden", !shouldShowSource);
  resultEl.classList.remove("hidden");
}

function getRank(score) {
  if (score >= 120) return "S+";
  if (score >= 100) return "S";
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "F";
}

function getRankClass(rank) {
  const normalized = rank.toLowerCase().replace("+", "-plus");
  return `rank--${normalized}`;
}

function getRankTitle(rank, stats) {
  const titles = rankTitles[rank] || [];
  if (!titles.length) return "";
  const seed = `${rank}|${stats.score}|${stats.wpm}|${stats.accuracy}|${stats.totalTypedChars}|${stats.keyPresses}|${state.targetText.length}`;
  return titles[Math.abs(hashString(seed)) % titles.length];
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function modeLabel() {
  if (state.mode === "time") return `${state.options.time}s`;
  if (state.mode === "words") return `${state.options.words}w`;
  if (state.mode === "competition") return isCompetitionTimed() ? `hot takes ${state.options.competitionTime}s` : "hot takes full run";
  return `quote ${state.options.quote}`;
}

function startTest() {
  clearInterval(state.timer);
  configureTest();
  state.startedAt = null;
  state.finished = false;
  state.lastStats = null;
  state.ready = true;
  state.pendingScore = null;
  inputEl.value = "";
  state.keyPresses = 0;
  state.correctKeyPresses = 0;
  state.lastInputAt = null;
  renderedTarget = "";
  wordsEl.scrollTop = 0;
  playerNameEl.value = "";
  saveScoreButton.disabled = false;
  saveScoreButton.textContent = "save";
  quoteSourceEl.classList.add("hidden");
  quoteSourceEl.textContent = "";
  inputEl.disabled = state.mode === "quote" && !monkeytypeQuotes.length;
  resultEl.classList.add("hidden");
  document.body.classList.remove("showing-result");
  renderWords();
  if (!state.awaitingCompetitionStart) inputEl.focus();
}

function finishTest() {
  if (state.finished) return;

  state.finished = true;
  setCompetitionAwaiting(false);
  clearInterval(state.timer);
  inputEl.disabled = true;
  caretEl.classList.add("hidden");

  const stats = calculateStats();
  stats.rank = getRank(stats.score);
  stats.rankTitle = getRankTitle(stats.rank, stats);
  state.lastStats = stats;
  state.pendingScore = {
    mode: modeLabel(),
    score: stats.score,
    wpm: stats.wpm,
    accuracy: stats.accuracy,
    rank: stats.rank,
    rankTitle: stats.rankTitle,
    source: state.currentQuoteSource,
    date: new Date().toISOString()
  };
  renderWords();
  renderResult(stats);
  document.body.classList.add("showing-result");
}

function renderLeaderboard() {
  const scores = getScores()
    .sort((a, b) => b.score - a.score || b.accuracy - a.accuracy || b.wpm - a.wpm)
    .slice(0, 10);

  leaderboardEl.innerHTML = "";

  if (!scores.length) {
    leaderboardEl.innerHTML = '<tr><td class="empty" colspan="6">no scores yet</td></tr>';
    return;
  }

  scores.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.name)}</td>
      <td>${escapeHtml(entry.mode)}</td>
      <td>${entry.score}</td>
      <td>${entry.wpm}</td>
      <td>${entry.accuracy}%</td>
    `;
    leaderboardEl.appendChild(row);
  });
}

function openLeaderboard() {
  renderLeaderboard();
  if (!leaderboardDialog.open) leaderboardDialog.showModal();
}

function savePendingScore() {
  if (!state.pendingScore) return;

  const scores = getScores();
  scores.push({
    name: playerNameEl.value.trim() || "guest",
    ...state.pendingScore
  });
  saveScores(scores);
  state.pendingScore = null;
  saveScoreButton.disabled = true;
  saveScoreButton.textContent = "saved";
  renderLeaderboard();
}

function selectMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  document.querySelectorAll(".option-row").forEach((row) => {
    row.classList.toggle("hidden", row.dataset.options !== mode);
  });
  resetTest();
}

function resetTest() {
  clearInterval(state.timer);
  configureTest();
  state.startedAt = null;
  state.finished = false;
  state.ready = true;
  state.lastStats = null;
  state.pendingScore = null;
  inputEl.value = "";
  state.keyPresses = 0;
  state.correctKeyPresses = 0;
  state.lastInputAt = null;
  renderedTarget = "";
  wordsEl.scrollTop = 0;
  playerNameEl.value = "";
  saveScoreButton.disabled = false;
  saveScoreButton.textContent = "save";
  quoteSourceEl.classList.add("hidden");
  quoteSourceEl.textContent = "";
  inputEl.disabled = state.mode === "quote" && !monkeytypeQuotes.length;
  resultEl.classList.add("hidden");
  document.body.classList.remove("showing-result");
  renderWords();
  if (!state.awaitingCompetitionStart) inputEl.focus();
}

document.querySelectorAll(".mode").forEach((button) => {
  button.addEventListener("click", () => selectMode(button.dataset.mode));
});

document.querySelectorAll(".option").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest(".option-row");
    const mode = row.dataset.options;
    const value = button.dataset.value;
    if (mode === "competition") {
      state.options.competition = "thicc";
      state.options.competitionTime = value === "full" ? null : Number(value);
    } else {
      state.options[mode] = Number.isNaN(Number(value)) ? value : Number(value);
    }
    row.querySelectorAll(".option").forEach((option) => option.classList.remove("active"));
    button.classList.add("active");
    resetTest();
  });
});

repeatButton.addEventListener("click", () => {
  state.preserveTarget = true;
  startTest();
});
nextButton.addEventListener("click", () => {
  startTest();
});

document.getElementById("test").addEventListener("click", () => inputEl.focus());

inputEl.addEventListener("input", () => {
  beginTest();
  renderWords();
  if (state.mode !== "time" && inputEl.value.length >= state.targetText.length) finishTest();
});

nameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  savePendingScore();
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTypingName = target === playerNameEl;
  const isCommand = event.ctrlKey || event.metaKey || event.altKey;
  const isPrintable = event.key.length === 1;

  if (leaderboardDialog.open || isCommand) return;

  if (event.key === "Escape" || event.code === "Escape") {
    event.preventDefault();
    startTest();
    return;
  }

  if (isTypingName || state.finished) return;

  if (state.awaitingCompetitionStart) {
    event.preventDefault();
    if (event.code === "Space") {
      setCompetitionAwaiting(false);
      inputEl.focus();
      beginTest();
      renderWords();
    }
    return;
  }

  if (event.key === "Backspace" && document.activeElement === inputEl && removeExtraCharacterAtCurrentSpace()) {
    event.preventDefault();
    return;
  }

  if (isPrintable && document.activeElement === inputEl) {
    recordTypedKey(event.key);
    if (event.key !== " " && addExtraCharacterAtCurrentSpace(event.key)) {
      event.preventDefault();
      beginTest();
      return;
    }
  }

  if (!isPrintable) return;

  if (document.activeElement !== inputEl) {
    event.preventDefault();
    inputEl.focus();
    recordTypedKey(event.key);
    if (event.key !== " " && addExtraCharacterAtCurrentSpace(event.key)) {
      beginTest();
      return;
    }
    inputEl.value += event.key;
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  }
}, true);

clearScoresButton.addEventListener("click", () => {
  if (confirm("Clear all local leaderboard scores on this browser?")) {
    saveScores([]);
    renderLeaderboard();
  }
});

leaderboardButton.addEventListener("click", () => {
  openLeaderboard();
});

closeLeaderboardButton.addEventListener("click", () => {
  leaderboardDialog.close();
});

leaderboardDialog.addEventListener("click", (event) => {
  if (event.target === leaderboardDialog) leaderboardDialog.close();
});

focusButton.addEventListener("click", () => {
  document.body.classList.toggle("focus");
  inputEl.focus();
});

window.addEventListener("resize", positionCaret);

resetTest();
renderWords();
renderLeaderboard();
