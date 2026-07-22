(function (root, factory) {
  const a = factory();
  if (typeof module === "object" && module.exports) module.exports = a;
  root.TicTacToeCore = a;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  function checkWin(board, size, index, mark) {
    const row = Math.floor(index / size),
      col = index % size;
    for (const [dr, dc] of dirs) {
      const cells = [{ row, col }];
      for (const sign of [-1, 1])
        for (let n = 1; ; n++) {
          const r = row + dr * n * sign,
            c = col + dc * n * sign;
          if (
            r < 0 ||
            c < 0 ||
            r >= size ||
            c >= size ||
            board[r * size + c] !== mark
          )
            break;
          sign < 0
            ? cells.unshift({ row: r, col: c })
            : cells.push({ row: r, col: c });
        }
      if (cells.length >= 5) return { won: true, cells, direction: [dr, dc] };
    }
    return { won: false, cells: [] };
  }
  function createState(
    size = 10,
    settings = {},
    scores = { X: 0, O: 0, draws: 0 },
    startingMark = "X",
    token = 1,
  ) {
    return {
      size,
      board: Array(size * size).fill(null),
      currentMark: startingMark,
      startingMark,
      mode: settings.mode || "human",
      aiDifficulty: settings.aiDifficulty || "medium",
      gameOver: false,
      winningCells: [],
      scores: { ...scores },
      gameToken: token,
    };
  }
  function play(state, index) {
    if (
      state.gameOver ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= state.board.length ||
      state.board[index]
    )
      return { valid: false };
    const mark = state.currentMark;
    state.board[index] = mark;
    const result = checkWin(state.board, state.size, index, mark);
    if (result.won) {
      state.gameOver = true;
      state.winningCells = result.cells;
      state.scores[mark]++;
      return { valid: true, won: true, mark, direction: result.direction };
    }
    if (state.board.every(Boolean)) {
      state.gameOver = true;
      state.scores.draws++;
      return { valid: true, draw: true, mark };
    }
    state.currentMark = mark === "X" ? "O" : "X";
    return { valid: true, mark };
  }
  return { checkWin, createState, play };
});
(function (root) {
  if (typeof document === "undefined") return;
  const C = root.TicTacToeCore,
    e = {
      setup: document.querySelector("#setup"),
      game: document.querySelector("#game"),
      nx: document.querySelector("#name-x"),
      no: document.querySelector("#name-o"),
      mode: document.querySelector("#mode"),
      difficulty: document.querySelector("#difficulty"),
      size: document.querySelector("#size"),
      start: document.querySelector("#start"),
      board: document.querySelector("#board"),
      turn: document.querySelector("#turn"),
      sx: document.querySelector("#score-x"),
      so: document.querySelector("#score-o"),
      draws: document.querySelector("#draws"),
      status: document.querySelector("#status"),
      again: document.querySelector("#again"),
      reset: document.querySelector("#reset-score"),
      settings: document.querySelector("#settings"),
    };
  let state,
    names = { X: "Hráč X", O: "Hráč O" },
    scores = { X: 0, O: 0, draws: 0 },
    starting = "X",
    token = 0,
    worker = null,
    busy = false;
  function start(newSeries = true) {
    if (newSeries) {
      scores = { X: 0, O: 0, draws: 0 };
      starting = "X";
    }
    names = {
      X: e.nx.value.trim() || "Hráč X",
      O: e.no.value.trim() || (e.mode.value === "ai" ? "Počítač" : "Hráč O"),
    };
    token++;
    state = C.createState(
      Number(e.size.value),
      { mode: e.mode.value, aiDifficulty: e.difficulty.value },
      scores,
      starting,
      token,
    );
    e.setup.hidden = true;
    e.game.hidden = false;
    renderBoard();
    update();
    if (isAI()) askAI();
  }
  function renderBoard() {
    e.board.replaceChildren();
    e.board.style.setProperty("--size", state.size);
    state.board.forEach((v, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cell";
      b.dataset.index = i;
      b.setAttribute("role", "gridcell");
      b.setAttribute(
        "aria-label",
        `Řádek ${Math.floor(i / state.size) + 1}, sloupec ${(i % state.size) + 1}, prázdné pole`,
      );
      b.addEventListener("click", () => humanMove(i));
      e.board.append(b);
    });
  }
  function sync() {
    [...e.board.children].forEach((b, i) => {
      const v = state.board[i];
      if (b.dataset.mark !== (v || "")) {
        b.dataset.mark = v || "";
        b.replaceChildren();
        if (v) {
          const appearance = root.TICTACTOE_THEME?.[v];
          if (appearance?.image) {
            const image = document.createElement("img");
            image.src = appearance.image;
            image.alt = "";
            image.addEventListener("error", () => {
              b.textContent = appearance.fallback || v;
            }, { once: true });
            b.append(image);
          } else b.textContent = appearance?.fallback || v;
        }
      }
      b.className = `cell ${v ? v.toLowerCase() : ""} ${state.winningCells.some((c) => c.row * state.size + c.col === i) ? "win" : ""}`;
      b.disabled = state.gameOver || busy || Boolean(v);
      if (v)
        b.setAttribute(
          "aria-label",
          `${v} na řádku ${Math.floor(i / state.size) + 1}, sloupci ${(i % state.size) + 1}`,
        );
    });
  }
  function update() {
    e.sx.textContent = `${names.X}: ${scores.X}`;
    e.so.textContent = `${names.O}: ${scores.O}`;
    e.draws.textContent = `Remízy: ${scores.draws}`;
    e.turn.textContent = state.gameOver
      ? "Konec hry"
      : `Na tahu: ${names[state.currentMark]}`;
    sync();
  }
  function humanMove(i) {
    if (busy || isAI()) return;
    move(i);
  }
  function move(i, computerMove = false) {
    const r = C.play(state, i);
    if (!r.valid) return;
    scores = state.scores;
    update();
    const row = Math.floor(i / state.size) + 1;
    const col = (i % state.size) + 1;
    const directionNames = { "0,1": "vodorovně", "1,0": "svisle", "1,1": "diagonálně", "1,-1": "diagonálně" };
    const moveMessage = computerMove ? `Počítač zahrál na řádek ${row}, sloupec ${col}. ` : "";
    if (r.won)
      e.status.textContent = `${moveMessage}Vyhrává ${names[r.mark]} ${directionNames[r.direction.join(",")]}. Vítězná řada má ${state.winningCells.length} znaků.`;
    else if (r.draw) e.status.textContent = "Mřížka je plná. Remíza!";
    else {
      e.status.textContent = `${moveMessage}Na tahu je ${names[state.currentMark]}.`;
      if (isAI()) askAI();
    }
  }
  function isAI() {
    return (
      state &&
      !state.gameOver &&
      state.mode === "ai" &&
      state.currentMark === "O"
    );
  }
  function askAI() {
    busy = true;
    e.status.textContent = "Přemýšlím…";
    sync();
    worker?.terminate();
    worker = new Worker("ai-worker.js");
    const t = state.gameToken;
    worker.onmessage = (ev) => {
      if (!state || ev.data.gameToken !== state.gameToken) return;
      busy = false;
      move(ev.data.index, true);
      worker.terminate();
      worker = null;
    };
    worker.postMessage({
      board: state.board,
      size: state.size,
      difficulty: state.aiDifficulty,
      gameToken: t,
    });
  }
  e.start.addEventListener("click", () => start(true));
  e.again.addEventListener("click", () => {
    starting = starting === "X" ? "O" : "X";
    start(false);
  });
  e.reset.addEventListener("click", () => {
    scores = { X: 0, O: 0, draws: 0 };
    state.scores = scores;
    update();
  });
  e.settings.addEventListener("click", () => {
    token++;
    worker?.terminate();
    worker = null;
    busy = false;
    e.game.hidden = true;
    e.setup.hidden = false;
  });
  e.mode.addEventListener("change", () => {
    e.difficulty.disabled = e.mode.value !== "ai";
  });
})(typeof window !== "undefined" ? window : globalThis);
