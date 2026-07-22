(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SnakeCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const vectors = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
  const opposite = { up: "down", down: "up", left: "right", right: "left" };
  const difficulties = {
    easy: {
      label: "Lehká",
      interval: 150,
      small: 10,
      bonus: 75,
      bonusMs: 6000,
    },
    medium: {
      label: "Střední",
      interval: 105,
      small: 15,
      bonus: 120,
      bonusMs: 4000,
    },
    hard: {
      label: "Těžká",
      interval: 75,
      small: 25,
      bonus: 200,
      bonusMs: 3000,
    },
  };
  const key = (cell) => `${cell.row},${cell.col}`;

  function initialSnake(level) {
    const [dr, dc] = vectors[opposite[level.start.direction]];
    return Array.from({ length: level.start.length }, (_, i) => ({
      row: level.start.head.row + dr * i,
      col: level.start.head.col + dc * i,
    }));
  }

  function normalize(cell, level) {
    if (level.wrapEdges)
      return {
        row: (cell.row + level.rows) % level.rows,
        col: (cell.col + level.cols) % level.cols,
      };
    return cell.row < 0 ||
      cell.col < 0 ||
      cell.row >= level.rows ||
      cell.col >= level.cols
      ? null
      : cell;
  }

  function reachable(level, start, blockedExtra = []) {
    const blocked = new Set([...level.obstacles, ...blockedExtra].map(key));
    blocked.delete(key(start));
    const seen = new Set([key(start)]);
    const queue = [start];
    while (queue.length) {
      const current = queue.shift();
      for (const [dr, dc] of Object.values(vectors)) {
        const next = normalize(
          { row: current.row + dr, col: current.col + dc },
          level,
        );
        if (!next || blocked.has(key(next)) || seen.has(key(next))) continue;
        seen.add(key(next));
        queue.push(next);
      }
    }
    return seen;
  }

  function validateLevel(level) {
    if (!level || level.rows < 8 || level.cols < 8)
      return { valid: false, reason: "Neplatná velikost levelu." };
    const obstacleKeys = new Set();
    for (const cell of level.obstacles) {
      if (
        cell.row < 0 ||
        cell.col < 0 ||
        cell.row >= level.rows ||
        cell.col >= level.cols
      )
        return { valid: false, reason: "Překážka je mimo mřížku." };
      obstacleKeys.add(key(cell));
    }
    const snake = initialSnake(level);
    if (
      snake.some(
        (cell) =>
          cell.row < 0 ||
          cell.col < 0 ||
          cell.row >= level.rows ||
          cell.col >= level.cols ||
          obstacleKeys.has(key(cell)),
      )
    )
      return { valid: false, reason: "Neplatný start hada." };
    if (new Set(snake.map(key)).size !== snake.length)
      return { valid: false, reason: "Počáteční tělo se překrývá." };
    const area = reachable(level, snake[0]);
    if (area.size < Math.max(20, snake.length + 5))
      return { valid: false, reason: "Dosažitelná oblast je příliš malá." };
    return { valid: true, reachable: area.size };
  }

  function createState(level, difficulty = "medium", bestScore = 0, token = 1) {
    const state = {
      mode: "ready",
      difficulty,
      levelId: level.id,
      score: 0,
      bestScore,
      smallFoodCollected: 0,
      snake: initialSnake(level),
      direction: level.start.direction,
      directionQueue: [],
      food: null,
      bonusFood: null,
      bonusExpiresAt: null,
      lastStepAt: 0,
      gameToken: token,
    };
    spawnFood(state, level);
    return state;
  }

  function queueDirection(state, direction) {
    if (!vectors[direction] || state.directionQueue.length >= 2) return false;
    const previous = state.directionQueue.at(-1) || state.direction;
    if (direction === previous || direction === opposite[previous])
      return false;
    state.directionQueue.push(direction);
    return true;
  }

  function freeReachableCells(state, level) {
    const occupied = new Set([...state.snake, ...level.obstacles].map(key));
    if (state.food) occupied.add(key(state.food));
    if (state.bonusFood) occupied.add(key(state.bonusFood));
    const area = reachable(level, state.snake[0], state.snake.slice(1));
    const result = [];
    for (const value of area) {
      const [row, col] = value.split(",").map(Number);
      if (!occupied.has(value)) result.push({ row, col });
    }
    return result;
  }

  function randomFree(state, level, random = Math.random) {
    const cells = freeReachableCells(state, level);
    return cells.length ? cells[Math.floor(random() * cells.length)] : null;
  }

  function spawnFood(state, level, random = Math.random) {
    state.food = randomFree(state, level, random);
    if (!state.food) state.mode = "levelComplete";
    return state.food;
  }

  function spawnBonus(state, level, now, random = Math.random) {
    state.food = null;
    state.bonusFood = randomFree(state, level, random);
    if (!state.bonusFood) {
      state.mode = "levelComplete";
      return null;
    }
    state.bonusExpiresAt = now + difficulties[state.difficulty].bonusMs;
    return state.bonusFood;
  }

  function expireBonus(state, level, random = Math.random) {
    state.bonusFood = null;
    state.bonusExpiresAt = null;
    state.smallFoodCollected = 0;
    return spawnFood(state, level, random);
  }

  function step(state, level, now = Date.now(), random = Math.random) {
    if (state.mode !== "playing") return { moved: false };
    if (state.bonusFood && now >= state.bonusExpiresAt)
      expireBonus(state, level, random);
    if (state.mode === "levelComplete")
      return { moved: false, levelComplete: true };
    if (state.directionQueue.length)
      state.direction = state.directionQueue.shift();
    const [dr, dc] = vectors[state.direction];
    const head = normalize(
      { row: state.snake[0].row + dr, col: state.snake[0].col + dc },
      level,
    );
    if (!head) {
      state.mode = "gameOver";
      return { moved: false, collision: "edge" };
    }
    const obstacle = new Set(level.obstacles.map(key));
    if (obstacle.has(key(head))) {
      state.mode = "gameOver";
      return { moved: false, collision: "obstacle" };
    }
    const eatsSmall = state.food && key(head) === key(state.food);
    const eatsBonus = state.bonusFood && key(head) === key(state.bonusFood);
    const grows = eatsSmall || eatsBonus;
    const bodyToCheck = grows ? state.snake : state.snake.slice(0, -1);
    if (bodyToCheck.some((cell) => key(cell) === key(head))) {
      state.mode = "gameOver";
      return { moved: false, collision: "self" };
    }
    state.snake.unshift(head);
    if (!grows) state.snake.pop();
    const rules = difficulties[state.difficulty];
    if (eatsSmall) {
      state.score += rules.small;
      state.smallFoodCollected++;
      state.food = null;
      if (state.smallFoodCollected === 5) spawnBonus(state, level, now, random);
      else spawnFood(state, level, random);
    } else if (eatsBonus) {
      state.score += rules.bonus;
      state.bonusFood = null;
      state.bonusExpiresAt = null;
      state.smallFoodCollected = 0;
      spawnFood(state, level, random);
    }
    state.bestScore = Math.max(state.bestScore, state.score);
    return {
      moved: true,
      ateSmall: Boolean(eatsSmall),
      ateBonus: Boolean(eatsBonus),
      levelComplete: state.mode === "levelComplete",
    };
  }

  return {
    vectors,
    opposite,
    difficulties,
    key,
    initialSnake,
    normalize,
    reachable,
    validateLevel,
    createState,
    queueDirection,
    freeReachableCells,
    spawnFood,
    spawnBonus,
    expireBonus,
    step,
  };
});

(function (root) {
  if (typeof document === "undefined") return;
  const Core = root.SnakeCore;
  const levels = root.SNAKE_LEVELS;
  const el = {
    setup: document.getElementById("setup"),
    game: document.getElementById("game"),
    difficulty: document.getElementById("difficulty"),
    level: document.getElementById("level"),
    start: document.getElementById("start"),
    score: document.getElementById("score"),
    best: document.getElementById("best"),
    levelName: document.getElementById("level-name"),
    difficultyName: document.getElementById("difficulty-name"),
    toBonus: document.getElementById("to-bonus"),
    bonusBar: document.getElementById("bonus-bar"),
    canvasWrap: document.getElementById("canvas-wrap"),
    board: document.getElementById("board"),
    status: document.getElementById("status"),
    pause: document.getElementById("pause"),
    restart: document.getElementById("restart"),
    settings: document.getElementById("settings"),
  };
  const context = el.board.getContext("2d");
  let state = null,
    level = null,
    frame = 0,
    token = 0,
    pausedAt = 0,
    touchStart = null;
  const images = {};

  levels.forEach((item) => {
    const result = Core.validateLevel(item);
    if (!result.valid) throw new Error(`${item.title}: ${result.reason}`);
    el.level.add(new Option(item.title, item.id));
  });
  for (const [name, config] of Object.entries(root.SNAKE_THEME || {})) {
    if (!config.image) continue;
    const image = new Image();
    image.addEventListener("load", () => {
      images[name] = image;
    });
    image.src = config.image;
  }

  function bestKey() {
    return `hernibudka.snake.best.${level.id}.${state.difficulty}`;
  }
  function saveBest() {
    try {
      localStorage.setItem(bestKey(), String(state.bestScore));
    } catch (_) {}
  }
  function loadBest(levelId, difficulty) {
    try {
      return (
        Number(
          localStorage.getItem(
            `hernibudka.snake.best.${levelId}.${difficulty}`,
          ),
        ) || 0
      );
    } catch (_) {
      return 0;
    }
  }
  function start() {
    level = levels.find((item) => item.id === el.level.value) || levels[0];
    token++;
    state = Core.createState(
      level,
      el.difficulty.value,
      loadBest(level.id, el.difficulty.value),
      token,
    );
    state.mode = "playing";
    state.lastStepAt = performance.now();
    el.setup.hidden = true;
    el.game.hidden = false;
    el.pause.textContent = "Pauza";
    resize();
    update("Hra začala.");
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(loop);
    el.canvasWrap.focus();
  }
  function update(message) {
    el.score.textContent = `Skóre: ${state.score}`;
    el.best.textContent = `Rekord: ${state.bestScore}`;
    el.levelName.textContent = level.title;
    el.difficultyName.textContent = Core.difficulties[state.difficulty].label;
    el.toBonus.textContent = state.bonusFood
      ? "Bonus je aktivní!"
      : `Do bonusu: ${5 - state.smallFoodCollected}`;
    if (message) el.status.textContent = message;
  }
  function loop(now) {
    if (!state) return;
    if (state.mode === "playing") {
      const rules = Core.difficulties[state.difficulty];
      if (state.bonusFood && Date.now() >= state.bonusExpiresAt) {
        Core.expireBonus(state, level);
        update("Bonus vypršel. Sbírej další kuličky.");
      }
      if (now - state.lastStepAt >= rules.interval) {
        state.lastStepAt =
          now -
          Math.min(now - state.lastStepAt - rules.interval, rules.interval);
        const result = Core.step(state, level, Date.now());
        if (result.ateSmall)
          update(
            state.smallFoodCollected === 5
              ? "Objevila se bonusová hvězda!"
              : "Kulička sebrána.",
          );
        if (result.ateBonus) update("Bonus sebrán!");
        if (state.mode === "gameOver") {
          saveBest();
          update("Konec hry. Had do něčeho narazil.");
        }
        if (state.mode === "levelComplete") {
          saveBest();
          update("Výborně! Level je dokončen.");
        }
      }
    }
    draw();
    frame = requestAnimationFrame(loop);
  }
  function drawImageOrFallback(name, col, row, cell, symbol = "") {
    const x = col * cell,
      y = row * cell,
      config = root.SNAKE_THEME?.[name] || {};
    if (images[name]) context.drawImage(images[name], x, y, cell, cell);
    else {
      context.fillStyle = config.fallbackColor || "#333";
      context.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      if (symbol || config.fallback) {
        context.fillStyle = "#fff";
        context.font = `bold ${cell * 0.75}px system-ui`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(symbol || config.fallback, x + cell / 2, y + cell / 2);
      }
    }
  }
  function draw() {
    if (!state) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1),
      width = el.canvasWrap.clientWidth,
      height = (width * level.rows) / level.cols;
    if (
      el.board.width !== Math.round(width * dpr) ||
      el.board.height !== Math.round(height * dpr)
    ) {
      el.board.width = Math.round(width * dpr);
      el.board.height = Math.round(height * dpr);
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cell = width / level.cols;
    if (images.background)
      context.drawImage(images.background, 0, 0, width, height);
    else {
      context.fillStyle =
        root.SNAKE_THEME?.background?.fallbackColor || "#e7f5d1";
      context.fillRect(0, 0, width, height);
    }
    context.strokeStyle = "rgba(49,91,59,.12)";
    context.lineWidth = 1;
    for (let col = 0; col <= level.cols; col++) {
      context.beginPath();
      context.moveTo(col * cell, 0);
      context.lineTo(col * cell, height);
      context.stroke();
    }
    for (let row = 0; row <= level.rows; row++) {
      context.beginPath();
      context.moveTo(0, row * cell);
      context.lineTo(width, row * cell);
      context.stroke();
    }
    level.obstacles.forEach((c) =>
      drawImageOrFallback("obstacle", c.col, c.row, cell),
    );
    if (state.food)
      drawImageOrFallback("food", state.food.col, state.food.row, cell, "●");
    if (state.bonusFood)
      drawImageOrFallback(
        "bonusFood",
        state.bonusFood.col,
        state.bonusFood.row,
        cell,
        "★",
      );
    state.snake
      .slice()
      .reverse()
      .forEach((c, reverseIndex) => {
        const originalIndex = state.snake.length - 1 - reverseIndex;
        drawImageOrFallback(
          originalIndex === 0
            ? "head"
            : originalIndex === state.snake.length - 1
              ? "tail"
              : "body",
          c.col,
          c.row,
          cell,
        );
      });
    const remaining = state.bonusFood
      ? Math.max(0, state.bonusExpiresAt - Date.now()) /
        Core.difficulties[state.difficulty].bonusMs
      : 0;
    el.bonusBar.style.width = `${remaining * 100}%`;
  }
  function resize() {
    if (state) draw();
  }
  function direction(value) {
    if (state?.mode === "playing") Core.queueDirection(state, value);
  }
  function togglePause(auto = false) {
    if (!state || !["playing", "paused"].includes(state.mode)) return;
    if (state.mode === "playing") {
      state.mode = "paused";
      pausedAt = Date.now();
      el.pause.textContent = "Pokračovat";
      update(auto ? "Hra se automaticky pozastavila." : "Hra je pozastavená.");
    } else {
      if (state.bonusExpiresAt) state.bonusExpiresAt += Date.now() - pausedAt;
      state.mode = "playing";
      state.lastStepAt = performance.now();
      el.pause.textContent = "Pauza";
      update("Pokračujeme.");
    }
  }
  const keyDirections = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };
  document.addEventListener("keydown", (event) => {
    if (keyDirections[event.key] && state?.mode === "playing") {
      event.preventDefault();
      direction(keyDirections[event.key]);
    } else if ((event.key === "p" || event.key === "P") && !el.game.hidden)
      togglePause();
  });
  document
    .querySelectorAll("[data-direction]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        direction(button.dataset.direction),
      ),
    );
  el.canvasWrap.addEventListener("pointerdown", (event) => {
    touchStart = { x: event.clientX, y: event.clientY };
  });
  el.canvasWrap.addEventListener("pointerup", (event) => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x,
      dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    direction(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up",
    );
  });
  el.start.addEventListener("click", start);
  el.restart.addEventListener("click", start);
  el.pause.addEventListener("click", () => togglePause());
  el.settings.addEventListener("click", () => {
    cancelAnimationFrame(frame);
    token++;
    state = null;
    el.game.hidden = true;
    el.setup.hidden = false;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state?.mode === "playing") togglePause(true);
  });
  window.addEventListener("resize", resize);
})(typeof window !== "undefined" ? window : globalThis);
