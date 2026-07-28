(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.WordBombCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const ranges = {
    short: [10000, 25000],
    normal: [15000, 40000],
    long: [25000, 60000],
  };
  function randomDuration(kind, random = Math.random) {
    const [min, max] = ranges[kind];
    return Math.round(min + random() * (max - min));
  }
  function createState(players, rounds, duration, categories) {
    return {
      players: players.map((name, index) => ({
        id: index,
        name,
        penalties: 0,
      })),
      totalRounds: rounds,
      round: 0,
      duration,
      categories: [...categories],
      usedCategoryIds: [],
      currentPlayerIndex: 0,
      mode: "ready",
      remainingMs: 0,
      startedAt: 0,
      transitioning: false,
      pendingExplosion: false,
    };
  }
  function nextCategory(state, random = Math.random) {
    let pool = state.categories.filter(
      (item) => !state.usedCategoryIds.includes(item.id),
    );
    if (!pool.length) {
      state.usedCategoryIds = [];
      pool = state.categories;
    }
    const item = pool[Math.floor(random() * pool.length)];
    state.usedCategoryIds.push(item.id);
    return item;
  }
  function pass(state) {
    state.currentPlayerIndex =
      (state.currentPlayerIndex + 1) % state.players.length;
    return state.players[state.currentPlayerIndex];
  }
  function explode(state) {
    const loser = state.players[state.currentPlayerIndex];
    loser.penalties++;
    state.mode = "exploded";
    return loser;
  }
  function winners(state) {
    const best = Math.min(...state.players.map((player) => player.penalties));
    return state.players.filter((player) => player.penalties === best);
  }
  return {
    ranges,
    randomDuration,
    createState,
    nextCategory,
    pass,
    explode,
    winners,
  };
});

(function (root) {
  "use strict";
  if (typeof document === "undefined") return;
  const Core = root.WordBombCore,
    categories = root.WORD_BOMB_CATEGORIES || [],
    groups = root.WORD_BOMB_GROUPS || {};
  const el = Object.fromEntries(
    [
      "setup",
      "game",
      "player-count",
      "rounds",
      "duration",
      "sound",
      "player-names",
      "category-groups",
      "setup-error",
      "start",
      "round",
      "category",
      "player-ring",
      "bomb",
      "bomb-symbol",
      "status",
      "pass",
      "next-round",
      "again",
      "settings",
      "scoreboard",
    ].map((id) => [id, document.getElementById(id)]),
  );
  let state = null,
    category = null,
    timer = null,
    gameToken = 0;
  for (let count = 4; count <= 10; count++)
    el["player-count"].add(new Option(`${count} hráči`, count));
  Object.entries(groups).forEach(([id, label]) => {
    const wrapper = document.createElement("label"),
      input = document.createElement("input");
    input.type = "checkbox";
    input.value = id;
    input.checked = true;
    wrapper.append(input, document.createTextNode(label));
    el["category-groups"].append(wrapper);
  });
  function renderNames() {
    const previous = [...el["player-names"].querySelectorAll("input")].map(
      (input) => input.value,
    );
    el["player-names"].replaceChildren();
    for (let index = 0; index < Number(el["player-count"].value); index++) {
      const label = document.createElement("label"),
        input = document.createElement("input");
      label.textContent = `Hráč ${index + 1}`;
      input.value = previous[index] || `Hráč ${index + 1}`;
      input.maxLength = 24;
      label.append(input);
      el["player-names"].append(label);
    }
  }
  function selectedCategories() {
    const selected = new Set(
      [...el["category-groups"].querySelectorAll("input:checked")].map(
        (input) => input.value,
      ),
    );
    return categories.filter((item) => selected.has(item.group));
  }
  function start() {
    const chosen = selectedCategories();
    if (!chosen.length) {
      el["setup-error"].textContent = "Vyber alespoň jednu skupinu kategorií.";
      return;
    }
    const names = [...el["player-names"].querySelectorAll("input")].map(
      (input, index) => input.value.trim() || `Hráč ${index + 1}`,
    );
    state = Core.createState(
      names,
      Number(el.rounds.value),
      el.duration.value,
      chosen,
    );
    gameToken++;
    el.setup.hidden = true;
    el.game.hidden = false;
    beginRound();
  }
  function beginRound() {
    clearTimer();
    state.round++;
    state.mode = "playing";
    state.transitioning = false;
    state.pendingExplosion = false;
    state.currentPlayerIndex = (state.round - 1) % state.players.length;
    category = Core.nextCategory(state);
    state.remainingMs = Core.randomDuration(state.duration);
    state.startedAt = performance.now();
    el.round.textContent = `Kolo ${state.round} z ${state.totalRounds}`;
    el.category.textContent = category.title;
    el.pass.hidden = false;
    el["next-round"].hidden = true;
    el.bomb.className = "bomb ticking";
    el["bomb-symbol"].textContent =
      root.WORD_BOMB_THEME?.bomb?.fallback || "💣";
    renderPlayers();
    renderScore();
    announce(
      `${state.players[state.currentPlayerIndex].name} začíná. Řekni slovo a předej dál.`,
    );
    schedule();
  }
  function schedule() {
    clearTimer();
    const token = gameToken;
    state.startedAt = performance.now();
    timer = setTimeout(() => {
      if (!state || token !== gameToken) return;
      if (state.transitioning) state.pendingExplosion = true;
      else explosion();
    }, state.remainingMs);
  }
  function pass() {
    if (!state || state.mode !== "playing" || state.transitioning) return;
    state.transitioning = true;
    el.pass.disabled = true;
    const elapsed = performance.now() - state.startedAt;
    state.remainingMs = Math.max(0, state.remainingMs - elapsed);
    state.startedAt = performance.now();
    clearTimer();
    Core.pass(state);
    renderPlayers();
    setTimeout(() => {
      if (!state || state.mode !== "playing") return;
      state.remainingMs = Math.max(
        0,
        state.remainingMs - (performance.now() - state.startedAt),
      );
      state.transitioning = false;
      el.pass.disabled = false;
      if (state.pendingExplosion || state.remainingMs <= 0) explosion();
      else {
        announce(
          `Bombičku drží ${state.players[state.currentPlayerIndex].name}.`,
        );
        schedule();
      }
    }, 260);
  }
  function explosion() {
    clearTimer();
    const loser = Core.explode(state);
    el.bomb.className = "bomb exploded";
    el["bomb-symbol"].textContent =
      root.WORD_BOMB_THEME?.explosion?.fallback || "💥";
    el.pass.hidden = true;
    renderPlayers();
    renderScore();
    playSound();
    if (state.round >= state.totalRounds) {
      const winning = Core.winners(state);
      state.mode = "finished";
      renderPlayers();
      announce(
        `Hra skončila. ${winning.length > 1 ? "Vyhrávají" : "Vyhrává"} ${winning.map((player) => player.name).join(" a ")}!`,
      );
      el["next-round"].hidden = true;
    } else {
      announce(`Bombička vybuchla u hráče ${loser.name}. Získává trestný bod.`);
      el["next-round"].hidden = false;
    }
  }
  function pause() {
    if (!state || state.mode !== "playing") return;
    const elapsed = performance.now() - state.startedAt;
    state.remainingMs = Math.max(0, state.remainingMs - elapsed);
    clearTimer();
    state.transitioning = false;
    el.pass.disabled = false;
    state.mode = "paused";
    announce("Hra je pozastavená, protože stránka není vidět.");
  }
  function resume() {
    if (!state || state.mode !== "paused") return;
    state.mode = "playing";
    announce(
      `Pokračujeme. Bombičku drží ${state.players[state.currentPlayerIndex].name}.`,
    );
    schedule();
  }
  function renderPlayers() {
    el["player-ring"].replaceChildren();
    state.players.forEach((player, index) => {
      const item = document.createElement("div");
      item.className = `player ${index === state.currentPlayerIndex && state.mode !== "finished" ? "active" : ""}`;
      item.style.setProperty(
        "--angle",
        `${(360 / state.players.length) * index}deg`,
      );
      item.textContent = `${player.name} · ${player.penalties}`;
      el["player-ring"].append(item);
    });
  }
  function renderScore() {
    el.scoreboard.replaceChildren();
    [...state.players]
      .sort((a, b) => a.penalties - b.penalties)
      .forEach((player) => {
        const item = document.createElement("li");
        item.textContent = `${player.name}: ${player.penalties} ${player.penalties === 1 ? "bod" : "body"}`;
        el.scoreboard.append(item);
      });
  }
  function announce(message) {
    el.status.textContent = message;
  }
  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }
  function playSound() {
    if (!el.sound.checked) return;
    try {
      const AudioEngine = root.AudioContext || root.webkitAudioContext,
        context = new AudioEngine(),
        oscillator = context.createOscillator(),
        gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 180;
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.25);
    } catch (_) {}
  }
  function settings() {
    clearTimer();
    gameToken++;
    state = null;
    el.game.hidden = true;
    el.setup.hidden = false;
  }
  el["player-count"].addEventListener("change", renderNames);
  el.start.addEventListener("click", start);
  el.pass.addEventListener("pointerup", pass);
  el["next-round"].addEventListener("click", beginRound);
  el.again.addEventListener("click", start);
  el.settings.addEventListener("click", settings);
  document.addEventListener("visibilitychange", () =>
    document.hidden ? pause() : resume(),
  );
  renderNames();
})(typeof window !== "undefined" ? window : globalThis);
