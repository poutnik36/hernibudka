(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.LudoCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const STARTS = { p1: 0, p2: 10, p3: 20, p4: 30 };
  const COMMON_TRACK = [
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    [5, 5],
    [5, 4],
    [5, 3],
    [5, 2],
    [5, 1],
    [6, 1],
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [8, 5],
    [9, 5],
    [10, 5],
    [11, 5],
    [11, 6],
    [11, 7],
    [10, 7],
    [9, 7],
    [8, 7],
    [7, 7],
    [7, 8],
    [7, 9],
    [7, 10],
    [7, 11],
    [6, 11],
    [5, 11],
    [5, 10],
    [5, 9],
    [5, 8],
    [5, 7],
    [4, 7],
    [3, 7],
    [2, 7],
    [1, 7],
    [1, 6],
  ].map(([row, col]) => ({ row, col }));
  function globalIndex(player, steps) {
    return (STARTS[player.id] + steps + 400) % 40;
  }
  function occupants(state, index, exclude) {
    return state.players.flatMap((p) =>
      p.pawns
        .filter(
          (x) =>
            x.id !== exclude &&
            x.state === "track" &&
            globalIndex(p, x.trackSteps) === index,
        )
        .map((x) => ({ player: p, pawn: x })),
    );
  }
  function getLegalMoves(state, playerId, dice) {
    const player = state.players.find((p) => p.id === playerId);
    if (!player || !player.active || state.ranking.includes(playerId))
      return [];
    const moves = [];
    for (const pawn of player.pawns) {
      if (pawn.state === "base") {
        if (dice !== 6) continue;
        const occ = occupants(state, STARTS[player.id], pawn.id);
        if (occ.some((x) => x.player.id === player.id)) continue;
        moves.push(
          makeMove(state, player, pawn, "track", 0, { deploys: true }),
        );
      } else if (pawn.state === "track") {
        const next = pawn.trackSteps + dice;
        if (next < 40) {
          const idx = globalIndex(player, next),
            occ = occupants(state, idx, pawn.id);
          if (occ.some((x) => x.player.id === player.id)) continue;
          moves.push(
            makeMove(state, player, pawn, "track", next, {
              captures: occ
                .filter((x) => x.player.id !== player.id)
                .map((x) => x.pawn.id),
            }),
          );
        } else {
          const home = next - 40;
          if (home > 3) continue;
          if (!homePathIsClear(player, pawn.id, 0, home)) continue;
          moves.push(
            makeMove(state, player, pawn, "home", home, {
              entersHome: true,
              finishes: home === 3,
            }),
          );
        }
      } else if (pawn.state === "home") {
        const home = pawn.homeIndex + dice;
        if (home > 3) continue;
        if (!homePathIsClear(player, pawn.id, pawn.homeIndex + 1, home))
          continue;
        moves.push(
          makeMove(state, player, pawn, "home", home, { finishes: home === 3 }),
        );
      }
    }
    return moves;
  }
  function homePathIsClear(player, pawnId, firstIndex, lastIndex) {
    return !player.pawns.some(
      (other) =>
        other.id !== pawnId &&
        other.state === "home" &&
        other.homeIndex >= firstIndex &&
        other.homeIndex <= lastIndex,
    );
  }
  function recordRoll(state, value) {
    state.rollAttempts++;
    state.consecutiveSixes = value === 6 ? state.consecutiveSixes + 1 : 0;
  }
  function canRetryFromBase(state, player, value) {
    return (
      value !== 6 &&
      state.rollAttempts < 3 &&
      player.pawns.every((pawn) => pawn.state === "base")
    );
  }
  function getsExtraRoll(state, player) {
    return (
      !state.ranking.includes(player.id) &&
      state.diceValue === 6 &&
      state.consecutiveSixes < 3
    );
  }
  function makeMove(state, player, pawn, toState, value, flags = {}) {
    const fromSteps = pawn.trackSteps;
    return {
      playerId: player.id,
      pawnId: pawn.id,
      toState,
      toSteps: toState === "track" ? value : null,
      toHome: toState === "home" ? value : null,
      fromSteps,
      captures: [],
      risk:
        toState === "track"
          ? danger(state, player, globalIndex(player, value))
          : 0,
      leavesDanger:
        pawn.state === "track" &&
        danger(state, player, globalIndex(player, pawn.trackSteps)) > 0,
      ...flags,
    };
  }
  function danger(state, player, index) {
    let risk = 0;
    for (const other of state.players.filter(
      (p) => p.active && p.id !== player.id,
    ))
      for (const pawn of other.pawns.filter((x) => x.state === "track")) {
        const distance =
          (index - globalIndex(other, pawn.trackSteps) + 40) % 40;
        if (distance >= 1 && distance <= 6) risk++;
      }
    return risk;
  }
  function applyMove(state, move) {
    const player = state.players.find((p) => p.id === move.playerId),
      pawn = player.pawns.find((p) => p.id === move.pawnId);
    if (move.toState === "track") {
      pawn.state = "track";
      pawn.trackSteps = move.toSteps;
      pawn.homeIndex = null;
      const idx = globalIndex(player, pawn.trackSteps);
      for (const other of state.players.filter((p) => p.id !== player.id))
        for (const target of other.pawns)
          if (
            target.state === "track" &&
            globalIndex(other, target.trackSteps) === idx
          ) {
            target.state = "base";
            target.trackSteps = 0;
            target.homeIndex = null;
          }
    } else {
      pawn.state = "home";
      pawn.homeIndex = move.toHome;
    }
    if (
      player.pawns.every((p) => p.state === "home") &&
      !state.ranking.includes(player.id)
    )
      state.ranking.push(player.id);
    return state;
  }
  function penalizeSix(state, playerId, pawnId) {
    const player = state.players.find((p) => p.id === playerId),
      pawn = player.pawns.find((p) => p.id === pawnId);
    if (pawn.state !== "track") return state;
    pawn.trackSteps -= 6;
    const idx = globalIndex(player, pawn.trackSteps);
    for (const other of state.players.filter((p) => p.id !== player.id))
      for (const target of other.pawns)
        if (
          target.state === "track" &&
          globalIndex(other, target.trackSteps) === idx
        ) {
          target.state = "base";
          target.trackSteps = 0;
        }
    return state;
  }
  function nextPlayer(state) {
    const active = state.players.filter(
      (p) => p.active && !state.ranking.includes(p.id),
    );
    if (!active.length) return null;
    for (let n = 1; n <= state.players.length; n++) {
      const i = (state.currentPlayerIndex + n) % state.players.length,
        p = state.players[i];
      if (p.active && !state.ranking.includes(p.id)) {
        state.currentPlayerIndex = i;
        return p;
      }
    }
    return null;
  }
  function createGame(players, mode = "normal") {
    return {
      mode,
      phase: "waitingForRoll",
      currentPlayerIndex: 0,
      diceValue: null,
      extraRoll: false,
      rollAttempts: 0,
      consecutiveSixes: 0,
      ranking: [],
      taskFieldIndexes: [],
      usedTaskIds: [],
      players: players
        .filter((p) => p.active)
        .map((p) => ({
          ...p,
          pawns: Array.from({ length: 4 }, (_, i) => ({
            id: `${p.id}-${i + 1}`,
            state: "base",
            trackSteps: 0,
            homeIndex: null,
          })),
        })),
    };
  }
  return {
    STARTS,
    COMMON_TRACK,
    globalIndex,
    getLegalMoves,
    applyMove,
    penalizeSix,
    nextPlayer,
    createGame,
    danger,
    homePathIsClear,
    recordRoll,
    canRetryFromBase,
    getsExtraRoll,
  };
});

(function (root) {
  "use strict";
  if (typeof document === "undefined") return;
  const C = root.LudoCore,
    A = root.LudoAI,
    tasks = root.LUDO_TASKS || [];
  const colors = [
    "#fbc02d",
    "#1e88e5",
    "#43a047",
    "#e53935",
    "#8e24aa",
    "#fb8c00",
    "#00acc1",
    "#6d4c41",
    "#d81b60",
    "#546e7a",
  ];
  const defaults = [
    {
      id: "p1",
      name: "Hráč 1",
      active: true,
      human: true,
      color: colors[0],
      difficulty: null,
    },
    {
      id: "p2",
      name: "Hráč 2",
      active: true,
      human: false,
      color: colors[1],
      difficulty: "medium",
    },
    {
      id: "p3",
      name: "Hráč 3",
      active: false,
      human: false,
      color: colors[2],
      difficulty: "medium",
    },
    {
      id: "p4",
      name: "Hráč 4",
      active: false,
      human: false,
      color: colors[3],
      difficulty: "medium",
    },
  ];
  const e = {
    setup: document.querySelector("#setup"),
    game: document.querySelector("#game"),
    configs: document.querySelector("#players-setup"),
    start: document.querySelector("#start"),
    error: document.querySelector("#setup-error"),
    tasksLabel: document.querySelector("#tasks-label"),
    tasksHelp: document.querySelector("#tasks-help"),
    board: document.querySelector("#board"),
    turn: document.querySelector("#turn-name"),
    dice: document.querySelector("#dice"),
    diceImage: document.querySelector("#dice-image"),
    diceFallback: document.querySelector("#dice-fallback"),
    roll: document.querySelector("#roll"),
    status: document.querySelector("#status"),
    score: document.querySelector("#scoreboard"),
    newGame: document.querySelector("#new"),
    taskDialog: document.querySelector("#task-dialog"),
    taskPlayer: document.querySelector("#task-player"),
    taskText: document.querySelector("#task-text"),
    result: document.querySelector("#result-dialog"),
    ranking: document.querySelector("#ranking"),
    resultNew: document.querySelector("#result-new"),
  };
  let state = null,
    legal = [],
    pendingMove = null,
    busy = false,
    pawnImageReady = false,
    configuredPlayers = defaults.map((player) => ({ ...player }));
  const pawnImage = new Image();
  pawnImage.addEventListener("load", () => {
    pawnImageReady = true;
    if (state) render();
  });
  pawnImage.src = root.LUDO_THEME?.pawn?.image || "";
  function node(name, text) {
    const n = document.createElement(name);
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function renderSetup() {
    defaults.forEach((p, i) => {
      let activeCheckbox = null;
      const box = node("div");
      box.className = "player-config";
      box.dataset.id = p.id;
      box.append(node("strong", `Hráč ${i + 1}`));
      if (i > 1) {
        const l = node("label", "Aktivní");
        activeCheckbox = document.createElement("input");
        activeCheckbox.type = "checkbox";
        activeCheckbox.className = "active";
        l.append(activeCheckbox);
        box.append(l);
      }
      const name = node("label", "Jméno");
      const ni = document.createElement("input");
      ni.className = "name";
      ni.value = p.name;
      name.append(ni);
      box.append(name);
      const type = node("label", "Ovládání");
      const ts = document.createElement("select");
      ts.className = "human";
      for (const [v, t] of [
        ["true", "Člověk"],
        ["false", "Skript"],
      ]) {
        const o = node("option", t);
        o.value = v;
        ts.append(o);
      }
      ts.value = String(p.human);
      if (i === 0) ts.disabled = true;
      type.append(ts);
      box.append(type);
      const diff = node("label", "Obtížnost");
      const ds = document.createElement("select");
      ds.className = "difficulty";
      for (const v of ["easy", "medium", "hard"]) {
        const o = node(
          "option",
          v === "easy" ? "Lehká" : v === "medium" ? "Střední" : "Těžká",
        );
        o.value = v;
        ds.append(o);
      }
      ds.value = "medium";
      diff.append(ds);
      box.append(diff);
      const color = node("label", "Barva");
      const cs = document.createElement("select");
      cs.className = "color";
      colors.forEach((v, j) => {
        const o = node("option", `Barva ${j + 1}`);
        o.value = v;
        o.style.background = v;
        cs.append(o);
      });
      cs.value = p.color;
      color.append(cs);
      box.append(color);
      e.configs.append(box);
      ts.addEventListener("change", updateTaskMode);
      activeCheckbox?.addEventListener("change", updateTaskMode);
    });
    updateTaskMode();
  }
  function readPlayers() {
    return [...e.configs.children].map((box, i) => ({
      id: box.dataset.id,
      name: box.querySelector(".name").value.trim() || `Hráč ${i + 1}`,
      active: i < 2 || box.querySelector(".active")?.checked,
      human: i === 0 || box.querySelector(".human").value === "true",
      difficulty: i === 0 ? null : box.querySelector(".difficulty").value,
      color: box.querySelector(".color").value,
    }));
  }
  function updateTaskMode() {
    const ps = readPlayers(),
      ok = ps.filter((p) => p.active && p.human).length >= 2,
      radio = document.querySelector('input[name="mode"][value="tasks"]');
    radio.disabled = !ok;
    e.tasksHelp.textContent = ok
      ? "Úkolový režim je dostupný."
      : "Úkoly vyžadují alespoň dva lidské hráče.";
    if (!ok && radio.checked)
      document.querySelector('input[value="normal"]').checked = true;
  }
  function start() {
    const ps = readPlayers(),
      active = ps.filter((p) => p.active);
    if (new Set(active.map((p) => p.color)).size !== active.length) {
      e.error.textContent = "Každý aktivní hráč musí mít jinou barvu.";
      return;
    }
    e.error.textContent = "";
    const mode = document.querySelector('input[name="mode"]:checked').value;
    configuredPlayers = ps;
    state = C.createGame(ps, mode);
    state.taskFieldIndexes = mode === "tasks" ? [3, 7, 13, 17, 25, 35] : [];
    e.setup.hidden = true;
    e.game.hidden = false;
    render();
    beginTurn();
  }
  const commonTrack = C.COMMON_TRACK.map(({ row, col }) => [row, col]);
  const bases = {
    p1: [
      [1, 1],
      [1, 2],
      [2, 1],
      [2, 2],
    ],
    p2: [
      [10, 1],
      [10, 2],
      [11, 1],
      [11, 2],
    ],
    p3: [
      [10, 10],
      [10, 11],
      [11, 10],
      [11, 11],
    ],
    p4: [
      [1, 10],
      [1, 11],
      [2, 10],
      [2, 11],
    ],
  };
  const homes = {
    p1: [
      [2, 6],
      [3, 6],
      [4, 6],
      [5, 6],
    ],
    p2: [
      [6, 2],
      [6, 3],
      [6, 4],
      [6, 5],
    ],
    p3: [
      [10, 6],
      [9, 6],
      [8, 6],
      [7, 6],
    ],
    p4: [
      [6, 10],
      [6, 9],
      [6, 8],
      [6, 7],
    ],
  };
  function point(cell) {
    return { x: (11 - cell[1]) * 60 + 30, y: (cell[0] - 1) * 60 + 30 };
  }
  const track = commonTrack.map(point);
  function svg(n, a = {}) {
    const x = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (const [k, v] of Object.entries(a)) x.setAttribute(k, v);
    return x;
  }
  function pawnPos(player, pawn, index) {
    if (pawn.state === "base") {
      return point(bases[player.id][index]);
    }
    if (pawn.state === "home") {
      return point(homes[player.id][pawn.homeIndex]);
    }
    return track[C.globalIndex(player, pawn.trackSteps)];
  }
  function render() {
    e.board.replaceChildren();
    e.board.append(
      svg("rect", {
        x: 0,
        y: 0,
        width: 660,
        height: 660,
        class: "board-background",
      }),
    );
    for (const player of configuredPlayers)
      for (const cell of bases[player.id])
        drawCell(
          cell,
          `base-field ${player.active ? "" : "inactive-field"}`,
          player.color,
        );
    for (let i = 0; i < track.length; i++) {
      const p = track[i],
        startingPlayer = configuredPlayers.find(
          (player) => C.STARTS[player.id] === i,
        ),
        c = svg("rect", {
          x: p.x - 27,
          y: p.y - 27,
          width: 54,
          height: 54,
          rx: 9,
          class: `track ${state.taskFieldIndexes.includes(i) ? "task-field" : ""} ${startingPlayer ? "start-field" : ""}`,
          ...(startingPlayer
            ? { style: `--start-color:${startingPlayer.color}` }
            : {}),
        });
      e.board.append(c);
      if (state.taskFieldIndexes.includes(i)) {
        const t = svg("text", { x: p.x, y: p.y + 6, "text-anchor": "middle" });
        t.textContent = "?";
        e.board.append(t);
      }
    }
    for (const p of configuredPlayers)
      for (let i = 0; i < 4; i++) {
        drawCell(
          homes[p.id][i],
          `home-field ${p.active ? "" : "inactive-field"}`,
          p.color,
        );
      }
    e.board.append(
      svg("rect", {
        x: 303,
        y: 303,
        width: 54,
        height: 54,
        rx: 9,
        class: "center",
      }),
    );
    const defs = svg("defs");
    for (const player of state.players) {
      const filter = svg("filter", {
        id: `pawn-tint-${player.id}`,
        x: "-20%",
        y: "-20%",
        width: "140%",
        height: "140%",
        "color-interpolation-filters": "sRGB",
      });
      filter.append(
        svg("feFlood", { "flood-color": player.color, result: "color" }),
        svg("feComposite", {
          in: "color",
          in2: "SourceAlpha",
          operator: "in",
        }),
      );
      defs.append(filter);
    }
    e.board.append(defs);
    for (const player of state.players)
      player.pawns.forEach((pawn, i) => {
        const p = pawnPos(player, pawn, i),
          offset =
            player.pawns.filter(
              (x, j) =>
                j < i &&
                x.state === "track" &&
                pawn.state === "track" &&
                C.globalIndex(player, x.trackSteps) ===
                  C.globalIndex(player, pawn.trackSteps),
            ).length * 7;
        const g = svg("g", {
          tabindex: legal.some((m) => m.pawnId === pawn.id) ? 0 : -1,
          role: "button",
          "aria-label": `${player.name}, figurka ${i + 1}`,
        });
        const isLegal = legal.some((m) => m.pawnId === pawn.id);
        const c = pawnImageReady
          ? svg("image", {
              href: root.LUDO_THEME.pawn.image,
              x: p.x + offset - 23,
              y: p.y + offset - 23,
              width: 46,
              height: 46,
              preserveAspectRatio: "xMidYMid meet",
              filter: `url(#pawn-tint-${player.id})`,
              class: "pawn pawn-image",
            })
          : svg("circle", {
              cx: p.x + offset,
              cy: p.y + offset,
              r: 19,
              fill: player.color,
              class: "pawn",
            });
        const hitbox = svg("circle", {
          cx: p.x + offset,
          cy: p.y + offset,
          r: 23,
          class: "pawn-hitbox",
        });
        g.append(c);
        if (isLegal) {
          g.append(
            svg("line", {
              x1: p.x + offset - 17,
              x2: p.x + offset + 17,
              y1: p.y + offset + 26,
              y2: p.y + offset + 26,
              class: "pawn-legal-line pawn-legal-line-back",
            }),
            svg("line", {
              x1: p.x + offset - 17,
              x2: p.x + offset + 17,
              y1: p.y + offset + 26,
              y2: p.y + offset + 26,
              class: "pawn-legal-line",
              stroke: player.color,
            }),
          );
        }
        g.append(hitbox);
        if (isLegal) {
          const go = () => selectPawn(pawn.id);
          g.addEventListener("pointerup", go);
          g.addEventListener("keydown", (x) => {
            if (x.key === "Enter" || x.key === " ") {
              x.preventDefault();
              go();
            }
          });
        }
        e.board.append(g);
      });
    renderScore();
  }
  function drawCell(cell, className, color) {
    const p = point(cell);
    e.board.append(
      svg("rect", {
        x: p.x - 27,
        y: p.y - 27,
        width: 54,
        height: 54,
        rx: 9,
        class: className,
        fill: color,
        stroke: color,
      }),
    );
  }
  function renderScore() {
    e.score.replaceChildren();
    state.players.forEach((p) => {
      const li = node(
        "li",
        `${p.name} ${p.human ? "👤" : "🤖"} · doma ${p.pawns.filter((x) => x.state === "home").length}/4`,
      );
      li.style.borderLeft = `8px solid ${p.color}`;
      e.score.append(li);
    });
  }
  function current() {
    return state.players[state.currentPlayerIndex];
  }
  function beginTurn(resetCounters = true, message = null) {
    if (state.ranking.length === state.players.length) {
      finish();
      return;
    }
    legal = [];
    state.phase = "waitingForRoll";
    busy = false;
    if (resetCounters) {
      state.rollAttempts = 0;
      state.consecutiveSixes = 0;
    }
    const p = current();
    e.turn.textContent = p.name;
    e.roll.disabled = !p.human;
    e.dice.disabled = !p.human;
    e.status.textContent = message || `${p.name} hází kostkou.`;
    render();
    if (!p.human) setTimeout(roll, 650);
  }
  function roll() {
    if (busy) return;
    busy = true;
    e.roll.disabled = true;
    e.dice.disabled = true;
    const p = current(),
      value = p.human
        ? 1 + Math.floor(Math.random() * 6)
        : A.weightedRoll(p.difficulty);
    C.recordRoll(state, value);
    state.diceValue = value;
    showDice(value);
    e.status.textContent = `${p.name} hodil/a ${value}.`;
    setTimeout(() => {
      legal = C.getLegalMoves(state, p.id, value);
      busy = false;
      if (!legal.length) {
        e.status.textContent += " Není možný žádný tah.";
        if (C.canRetryFromBase(state, p, value)) {
          const remaining = 3 - state.rollAttempts;
          setTimeout(
            () =>
              beginTurn(
                false,
                `${p.name} nemá figurku ve hře a hází znovu. Zbývá ${remaining} ${remaining === 1 ? "pokus" : "pokusy"}.`,
              ),
            700,
          );
        } else {
          setTimeout(endTurn, 700);
        }
      } else if (!p.human) {
        const m = A.chooseMove(legal, p.difficulty);
        setTimeout(() => selectPawn(m.pawnId), 500);
      } else {
        state.phase = "waitingForPawn";
        e.status.textContent += " Vyber zvýrazněnou figurku.";
        render();
      }
    }, 350);
  }
  function selectPawn(id) {
    if (busy) return;
    const move = legal.find((m) => m.pawnId === id);
    if (!move) return;
    busy = true;
    pendingMove = move;
    C.applyMove(state, move);
    legal = [];
    render();
    const p = current();
    if (
      state.mode === "tasks" &&
      p.human &&
      move.toState === "track" &&
      state.taskFieldIndexes.includes(C.globalIndex(p, move.toSteps))
    ) {
      showTask(p, move);
    } else setTimeout(endTurn, 350);
  }
  function showDice(value) {
    const fallback = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][value - 1];
    const source = root.LUDO_THEME?.dice?.images?.[value];
    e.dice.setAttribute(
      "aria-label",
      `Hodit kostkou, naposledy padlo ${value}`,
    );
    e.diceFallback.textContent = fallback;
    e.diceFallback.hidden = false;
    e.diceImage.hidden = true;
    if (!source) return;
    e.diceImage.onload = () => {
      e.diceImage.hidden = false;
      e.diceFallback.hidden = true;
    };
    e.diceImage.onerror = () => {
      e.diceImage.hidden = true;
      e.diceFallback.hidden = false;
    };
    e.diceImage.src = source;
  }
  function showTask(p, move) {
    let available = tasks.filter((t) => !state.usedTaskIds.includes(t.id));
    if (!available.length) {
      state.usedTaskIds = [];
      available = tasks;
    }
    const task = available[Math.floor(Math.random() * available.length)];
    state.usedTaskIds.push(task.id);
    e.taskPlayer.textContent = p.name;
    e.taskText.textContent = task.prompt;
    e.taskDialog.showModal();
    e.taskDialog.addEventListener("close", function done() {
      e.taskDialog.removeEventListener("close", done);
      if (e.taskDialog.returnValue === "failed")
        C.penalizeSix(state, p.id, move.pawnId);
      render();
      endTurn();
    });
  }
  function endTurn() {
    busy = false;
    const p = current();
    const getsExtraRoll = C.getsExtraRoll(state, p);
    if (!getsExtraRoll) {
      C.nextPlayer(state);
    }
    state.diceValue = null;
    if (getsExtraRoll) {
      beginTurn(
        false,
        `${p.name} hodil/a šestku a hází znovu (${state.consecutiveSixes}/3).`,
      );
    } else {
      beginTurn(true);
    }
  }
  function finish() {
    e.ranking.replaceChildren();
    state.ranking.forEach((id, i) =>
      e.ranking.append(
        node("li", `${i + 1}. ${state.players.find((p) => p.id === id).name}`),
      ),
    );
    e.result.showModal();
  }
  function reset() {
    e.result.close();
    e.game.hidden = true;
    e.setup.hidden = false;
    state = null;
  }
  e.start.addEventListener("click", start);
  e.roll.addEventListener("click", roll);
  e.dice.addEventListener("pointerup", roll);
  e.newGame.addEventListener("click", reset);
  e.resultNew.addEventListener("click", reset);
  renderSetup();
})(typeof window !== "undefined" ? window : globalThis);
