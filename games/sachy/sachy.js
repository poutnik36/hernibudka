import { Chess, describeSquare, legalMoves, pieceName, resultOf } from "./engine.js";
import { CHESS_THEME } from "./data/themes.js";

const elements = {
  setup: document.getElementById("setup"), game: document.getElementById("game"), whiteName: document.getElementById("white-name"), blackName: document.getElementById("black-name"), mode: document.getElementById("mode"), difficulty: document.getElementById("difficulty"), humanColor: document.getElementById("human-color"), start: document.getElementById("start"), board: document.getElementById("board"), whitePlayer: document.getElementById("white-player"), blackPlayer: document.getElementById("black-player"), turn: document.getElementById("turn"), status: document.getElementById("status"), history: document.getElementById("history"), again: document.getElementById("again"), resign: document.getElementById("resign"), settings: document.getElementById("settings"), promotion: document.getElementById("promotion"),
};
const typeNames = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
let chess = null, selected = null, targets = [], lastMove = null, names = { w: "Bílý hráč", b: "Černý hráč" }, aiColor = null, orientation = "w", worker = null, busy = false, finished = false, gameToken = 0, pendingPromotion = null;

function saveSettings() {
  try { localStorage.setItem("hernibudka.chess.settings", JSON.stringify({ whiteName: elements.whiteName.value, blackName: elements.blackName.value, mode: elements.mode.value, difficulty: elements.difficulty.value, humanColor: elements.humanColor.value })); } catch (_) {}
}
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("hernibudka.chess.settings"));
    if (!saved) return;
    elements.whiteName.value = saved.whiteName || elements.whiteName.value; elements.blackName.value = saved.blackName || elements.blackName.value;
    elements.mode.value = saved.mode || "human"; elements.difficulty.value = saved.difficulty || "medium"; elements.humanColor.value = saved.humanColor || "w";
  } catch (_) {}
  syncSettings();
}
function syncSettings() {
  const againstAi = elements.mode.value === "ai";
  elements.difficulty.disabled = !againstAi; elements.humanColor.disabled = !againstAi;
}
function start() {
  saveSettings(); terminateWorker(); gameToken++; chess = new Chess(); selected = null; targets = []; lastMove = null; finished = false;
  let human = elements.humanColor.value;
  if (human === "random") human = Math.random() < .5 ? "w" : "b";
  aiColor = elements.mode.value === "ai" ? (human === "w" ? "b" : "w") : null;
  orientation = aiColor ? human : "w";
  names = { w: elements.whiteName.value.trim() || "Bílý hráč", b: elements.blackName.value.trim() || "Černý hráč" };
  if (aiColor && ((aiColor === "w" && names.w === "Bílý hráč") || (aiColor === "b" && names.b === "Černý hráč"))) names[aiColor] = "Počítač";
  elements.setup.hidden = true; elements.game.hidden = false; render(); announce(`${names.w} hraje bílými. ${names.b} hraje černými. Bílý je na tahu.`); maybeAi();
}
function squares() {
  const files = orientation === "w" ? "abcdefgh" : "hgfedcba";
  const ranks = orientation === "w" ? "87654321" : "12345678";
  return [...ranks].flatMap((rank) => [...files].map((file) => file + rank));
}
function render() {
  elements.board.replaceChildren();
  elements.board.style.setProperty("--light", CHESS_THEME.board.lightSquare); elements.board.style.setProperty("--dark", CHESS_THEME.board.darkSquare);
  const checkedKing = chess.isCheck() ? findKing(chess.turn()) : null;
  for (const square of squares()) {
    const button = document.createElement("button"); const file = square.charCodeAt(0) - 97, rank = Number(square[1]); const piece = chess.get(square);
    button.type = "button"; button.className = `square ${(file + rank) % 2 ? "light" : "dark"}`; button.dataset.square = square; button.setAttribute("role", "gridcell"); button.setAttribute("aria-label", describeSquare(chess, square));
    if (square === selected) { button.classList.add("selected"); button.setAttribute("aria-pressed", "true"); }
    if (targets.some((move) => move.to === square)) button.classList.add(piece ? "capture" : "legal");
    if (lastMove && (lastMove.from === square || lastMove.to === square)) button.classList.add("last");
    if (checkedKing === square) button.classList.add("check");
    if (piece) button.append(pieceVisual(piece));
    const coordinate = document.createElement("span"); coordinate.className = "coordinate"; coordinate.setAttribute("aria-hidden", "true"); coordinate.textContent = square; button.append(coordinate);
    button.disabled = busy || finished; button.addEventListener("click", () => chooseSquare(square)); elements.board.append(button);
  }
  elements.whitePlayer.textContent = `♔ ${names.w}`; elements.blackPlayer.textContent = `♚ ${names.b}`;
  elements.turn.textContent = finished ? "Partie skončila" : busy ? "Přemýšlím…" : `Na tahu: ${names[chess.turn()]}`;
  renderHistory();
}
function pieceVisual(piece) {
  const config = CHESS_THEME.pieces[piece.color === "w" ? "white" : "black"][typeNames[piece.type]];
  const span = document.createElement("span"); span.setAttribute("aria-hidden", "true"); span.textContent = config.fallback;
  if (config.image) {
    const image = document.createElement("img"); image.className = "piece-img"; image.src = config.image; image.alt = "";
    image.addEventListener("load", () => span.replaceChildren(image), { once: true });
  }
  return span;
}
function findKing(color) {
  for (const square of "abcdefgh".split("").flatMap((file) => "12345678".split("").map((rank) => file + rank))) { const piece = chess.get(square); if (piece?.type === "k" && piece.color === color) return square; }
  return null;
}
function chooseSquare(square) {
  if (busy || finished || chess.turn() === aiColor) return;
  const piece = chess.get(square);
  if (!selected) {
    if (!piece || piece.color !== chess.turn()) return;
    selected = square; targets = legalMoves(chess, square); render(); announceSelection(); return;
  }
  const matching = targets.filter((move) => move.to === square);
  if (matching.length) {
    if (matching.some((move) => move.promotion)) { pendingPromotion = { from: selected, to: square }; elements.promotion.showModal(); elements.promotion.querySelector("button").focus(); return; }
    play({ from: selected, to: square }); return;
  }
  if (piece?.color === chess.turn()) { selected = square; targets = legalMoves(chess, square); render(); announceSelection(); }
  else { selected = null; targets = []; render(); announce("Výběr byl zrušen."); }
}
function announceSelection() {
  const targetNames = [...new Set(targets.map((move) => move.to))];
  announce(`${describeSquare(chess, selected)} vybrán. Legální cíle: ${targetNames.length ? targetNames.join(", ") : "žádné"}.`);
}
function play(move, fromAi = false) {
  let played;
  try { played = chess.move(move); } catch (_) { return; }
  selected = null; targets = []; lastMove = played; const outcome = resultOf(chess);
  if (outcome.over) { finished = true; terminateWorker(); announce(`${played.san}. ${outcome.text}`); }
  else announce(`${fromAi ? "Počítač zahrál " : "Tah "}${played.san}.${chess.isCheck() ? " Šach!" : ""} Na tahu je ${names[chess.turn()]}.`);
  render(); if (!finished) maybeAi();
}
function renderHistory() {
  elements.history.replaceChildren(); const history = chess.history();
  for (let index = 0; index < history.length; index += 2) { const item = document.createElement("li"); item.textContent = `${history[index]}${history[index + 1] ? `   ${history[index + 1]}` : ""}`; elements.history.append(item); }
}
function maybeAi() {
  if (!aiColor || chess.turn() !== aiColor || finished) return;
  busy = true; render(); announce("Přemýšlím…"); terminateWorker(); worker = new Worker("ai-worker.js", { type: "module" }); const token = gameToken, ply = chess.history().length;
  worker.onmessage = (event) => {
    if (!chess || event.data.gameToken !== gameToken || event.data.ply !== chess.history().length || chess.turn() !== aiColor || finished) return;
    busy = false; const move = event.data.move; terminateWorker(); if (move) play(move, true);
  };
  worker.onerror = () => { busy = false; terminateWorker(); render(); announce("Skriptový hráč narazil na chybu. Zkus partii spustit znovu."); };
  worker.postMessage({ fen: chess.fen(), difficulty: elements.difficulty.value, gameToken: token, ply });
}
function terminateWorker() { worker?.terminate(); worker = null; }
function announce(message) { elements.status.textContent = message; }

elements.mode.addEventListener("change", syncSettings); elements.start.addEventListener("click", start); elements.again.addEventListener("click", start);
elements.settings.addEventListener("click", () => { terminateWorker(); gameToken++; chess = null; busy = false; elements.game.hidden = true; elements.setup.hidden = false; });
elements.resign.addEventListener("click", () => { if (finished) return; const loser = chess.turn(); finished = true; terminateWorker(); busy = false; announce(`${names[loser]} se vzdal. Vyhrává ${names[loser === "w" ? "b" : "w"]}.`); render(); });
elements.promotion.querySelectorAll("[data-piece]").forEach((button) => button.addEventListener("click", () => { const move = { ...pendingPromotion, promotion: button.dataset.piece }; pendingPromotion = null; elements.promotion.close(); play(move); elements.board.querySelector(`[data-square="${move.to}"]`)?.focus(); }));
elements.promotion.addEventListener("cancel", (event) => event.preventDefault());
loadSettings();
