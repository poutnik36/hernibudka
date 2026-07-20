(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.MemoryCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
    "use strict";

    function fisherYates(source, random = Math.random) {
        const result = source.slice();
        for (let index = result.length - 1; index > 0; index -= 1) {
            const target = Math.floor(random() * (index + 1));
            [result[index], result[target]] = [result[target], result[index]];
        }
        return result;
    }

    function createDeck(pack, pairCount, random = Math.random) {
        if (!pack || !Array.isArray(pack.cards) || pack.cards.length < pairCount) {
            throw new Error("Balíček nemá dostatek různých motivů.");
        }
        const selected = fisherYates(pack.cards, random).slice(0, pairCount);
        const physicalCards = selected.flatMap((card) => ["a", "b"].map((copy) => ({
            ...card,
            pairId: card.id,
            cardId: `${card.id}-${copy}`,
            state: "down"
        })));
        return fisherYates(physicalCards, random);
    }

    function createState(players, cards, gameToken = 1) {
        return {
            players: players.map((name) => ({ name, score: 0 })),
            currentPlayer: 0,
            cards,
            flippedCardIds: [],
            matchedPairIds: [],
            locked: false,
            gameToken
        };
    }

    function canFlip(state, cardId) {
        const card = state.cards.find((candidate) => candidate.cardId === cardId);
        return Boolean(card && !state.locked && card.state === "down" && state.flippedCardIds.length < 2);
    }

    function flipCard(state, cardId) {
        if (!canFlip(state, cardId)) return { accepted: false, ready: false };
        const card = state.cards.find((candidate) => candidate.cardId === cardId);
        card.state = "up";
        state.flippedCardIds.push(cardId);
        const ready = state.flippedCardIds.length === 2;
        if (ready) state.locked = true;
        return { accepted: true, ready };
    }

    function resolveTurn(state) {
        if (state.flippedCardIds.length !== 2) return { resolved: false };
        const [first, second] = state.flippedCardIds.map((id) => state.cards.find((card) => card.cardId === id));
        const match = first.pairId === second.pairId;
        if (match) {
            first.state = "matched";
            second.state = "matched";
            state.matchedPairIds.push(first.pairId);
            state.players[state.currentPlayer].score += 1;
        } else {
            first.state = "down";
            second.state = "down";
            state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
        }
        state.flippedCardIds = [];
        state.locked = false;
        return { resolved: true, match, finished: state.cards.every((card) => card.state === "matched") };
    }

    function getWinner(players) {
        if (players[0].score === players[1].score) return { tie: true, winner: null };
        return { tie: false, winner: players[0].score > players[1].score ? 0 : 1 };
    }

    return { fisherYates, createDeck, createState, canFlip, flipCard, resolveTurn, getWinner };
});

(function (root) {
    "use strict";
    if (typeof document === "undefined") return;

    const { MEMORY_PACKS: packs, MEMORY_THEME: theme, MemoryCore: core } = root;
    if (!packs || !theme) return;

    const sizes = {
        small: { title: "Malá", columns: 4, rows: 3, pairs: 6 },
        medium: { title: "Střední", columns: 6, rows: 4, pairs: 12 },
        large: { title: "Velká", columns: 6, rows: 6, pairs: 18 }
    };
    const elements = {
        setup: document.querySelector("#setup-panel"), play: document.querySelector("#play-panel"), result: document.querySelector("#result-panel"),
        playerInputs: [document.querySelector("#player-one"), document.querySelector("#player-two")],
        packOptions: document.querySelector("#pack-options"), sizeOptions: document.querySelector("#size-options"),
        setupError: document.querySelector("#setup-error"), start: document.querySelector("#start-game"),
        board: document.querySelector("#memory-board"), status: document.querySelector("#game-status"), packTitle: document.querySelector("#pack-title"),
        currentPlayer: document.querySelector("#current-player"), remaining: document.querySelector("#remaining-pairs"),
        playerNames: [document.querySelector("#player-name-0"), document.querySelector("#player-name-1")],
        playerScores: [document.querySelector("#player-score-0"), document.querySelector("#player-score-1")],
        playerCards: [document.querySelector("#player-card-0"), document.querySelector("#player-card-1")],
        newGame: document.querySelector("#new-game"), playAgain: document.querySelector("#play-again"), changeGame: document.querySelector("#change-game"),
        resultHeading: document.querySelector("#result-heading"), resultText: document.querySelector("#result-text"),
        resultPlayers: [document.querySelector("#result-player-0"), document.querySelector("#result-player-1")]
    };

    let state = null;
    let selectedPack = Object.keys(packs)[0];
    let selectedSize = "small";
    let gameToken = 0;
    let turnTimer = null;

    function createRadio(container, group, value, content, checked) {
        const wrapper = document.createElement("div");
        wrapper.className = "choice";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = group;
        input.id = `${group}-${value}`;
        input.value = value;
        input.checked = checked;
        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.append(content);
        wrapper.append(input, label);
        container.append(wrapper);
        return input;
    }

    function renderOptions() {
        Object.values(packs).forEach((pack, index) => {
            const label = document.createElement("span");
            label.textContent = `${pack.icon} ${pack.title}`;
            const input = createRadio(elements.packOptions, "pack", pack.id, label, index === 0);
            input.addEventListener("change", () => { selectedPack = pack.id; updateSizeAvailability(); });
        });
        Object.entries(sizes).forEach(([id, size], index) => {
            const label = document.createElement("span");
            label.textContent = size.title;
            const detail = document.createElement("small");
            detail.textContent = `${size.columns} × ${size.rows} · ${size.pairs} dvojic`;
            label.append(detail);
            const input = createRadio(elements.sizeOptions, "size", id, label, index === 0);
            input.addEventListener("change", () => { selectedSize = id; });
        });
        updateSizeAvailability();
    }

    function updateSizeAvailability() {
        const count = packs[selectedPack].cards.length;
        Object.entries(sizes).forEach(([id, size]) => {
            const input = document.querySelector(`#size-${id}`);
            input.disabled = size.pairs > count;
            if (input.disabled && input.checked) {
                const firstAvailable = Object.entries(sizes).find(([, candidate]) => candidate.pairs <= count)[0];
                selectedSize = firstAvailable;
                document.querySelector(`#size-${firstAvailable}`).checked = true;
            }
        });
    }

    function safeName(input, fallback) {
        return input.value.trim() || fallback;
    }

    function cancelTurnTimer() {
        if (turnTimer !== null) window.clearTimeout(turnTimer);
        turnTimer = null;
    }

    function startGame() {
        cancelTurnTimer();
        gameToken += 1;
        const pack = packs[selectedPack];
        const size = sizes[selectedSize];
        const playerNames = [safeName(elements.playerInputs[0], "Hráč 1"), safeName(elements.playerInputs[1], "Hráč 2")];
        elements.playerInputs.forEach((input, index) => { input.value = playerNames[index]; });
        try {
            state = core.createState(playerNames, core.createDeck(pack, size.pairs), gameToken);
        } catch (error) {
            elements.setupError.textContent = "Tento balíček nemá dost karet pro vybranou velikost.";
            return;
        }
        elements.setupError.textContent = "";
        elements.setup.hidden = true;
        elements.result.hidden = true;
        elements.play.hidden = false;
        elements.packTitle.textContent = `${pack.icon} ${pack.title} · ${size.title}`;
        elements.board.style.setProperty("--columns", size.columns);
        renderBoard();
        updateScoreboard();
        setStatus(`${state.players[0].name} začíná. Otoč první kartu.`);
        requestAnimationFrame(() => elements.board.querySelector("button")?.focus());
    }

    function createPicture(card) {
        const visual = document.createElement("span");
        visual.className = "memory-card__visual";
        visual.setAttribute("aria-hidden", "true");
        visual.textContent = card.fallback;
        if (card.image) {
            const image = document.createElement("img");
            image.alt = card.alt;
            image.addEventListener("load", () => visual.replaceChildren(image), { once: true });
            image.addEventListener("error", () => image.remove(), { once: true });
            image.src = card.image;
        }
        return visual;
    }

    function createBack() {
        const back = document.createElement("span");
        back.className = "memory-card__face memory-card__back";
        back.setAttribute("aria-hidden", "true");
        back.textContent = theme.cardBack.fallback;
        if (theme.cardBack.image) {
            const image = document.createElement("img");
            image.alt = theme.cardBack.alt;
            image.addEventListener("load", () => back.replaceChildren(image), { once: true });
            image.addEventListener("error", () => image.remove(), { once: true });
            image.src = theme.cardBack.image;
        }
        return back;
    }

    function renderBoard() {
        elements.board.replaceChildren();
        state.cards.forEach((card, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "memory-card";
            button.dataset.cardId = card.cardId;
            button.dataset.state = card.state;
            button.setAttribute("role", "gridcell");
            button.setAttribute("aria-label", `Zakrytá karta ${index + 1}`);
            button.setAttribute("aria-pressed", "false");
            const inner = document.createElement("span");
            inner.className = "memory-card__inner";
            const front = document.createElement("span");
            front.className = "memory-card__face memory-card__front";
            front.setAttribute("aria-hidden", "true");
            front.append(createPicture(card));
            const label = document.createElement("span");
            label.className = "memory-card__label";
            label.textContent = card.label;
            front.append(label);
            inner.append(createBack(), front);
            button.append(inner);
            button.addEventListener("pointerdown", () => button.classList.add("is-pressed"));
            button.addEventListener("pointerup", () => button.classList.remove("is-pressed"));
            button.addEventListener("pointercancel", () => button.classList.remove("is-pressed"));
            button.addEventListener("click", () => chooseCard(card.cardId));
            elements.board.append(button);
        });
    }

    function syncCard(cardId) {
        const card = state.cards.find((candidate) => candidate.cardId === cardId);
        const button = elements.board.querySelector(`[data-card-id="${cardId}"]`);
        button.dataset.state = card.state;
        const revealed = card.state !== "down";
        button.setAttribute("aria-pressed", String(revealed));
        button.setAttribute("aria-label", revealed ? `${card.label}, ${card.state === "matched" ? "nalezená dvojice" : "otočená karta"}` : "Zakrytá karta");
        button.disabled = card.state === "matched";
    }

    function chooseCard(cardId) {
        const outcome = core.flipCard(state, cardId);
        if (!outcome.accepted) return;
        syncCard(cardId);
        const card = state.cards.find((candidate) => candidate.cardId === cardId);
        setStatus(`${state.players[state.currentPlayer].name} otočil kartu ${card.label}.`);
        if (!outcome.ready) return;

        const tokenAtTurn = state.gameToken;
        setStatus("Chvilku počkej, porovnávám dvojici…");
        turnTimer = window.setTimeout(() => {
            if (!state || state.gameToken !== tokenAtTurn) return;
            const cardIds = state.flippedCardIds.slice();
            const result = core.resolveTurn(state);
            cardIds.forEach(syncCard);
            updateScoreboard();
            if (result.finished) finishGame();
            else if (result.match) setStatus(`To je ono! ${state.players[state.currentPlayer].name} našel dvojici a pokračuje.`, "match");
            else setStatus(`Tentokrát ne. Teď hraje ${state.players[state.currentPlayer].name}.`, "miss");
            turnTimer = null;
        }, theme.matchDelay);
    }

    function updateScoreboard() {
        state.players.forEach((player, index) => {
            elements.playerNames[index].textContent = player.name;
            elements.playerScores[index].textContent = player.score;
            elements.playerCards[index].setAttribute("aria-current", String(index === state.currentPlayer));
        });
        elements.currentPlayer.textContent = state.players[state.currentPlayer].name;
        elements.remaining.textContent = state.cards.length / 2 - state.matchedPairIds.length;
    }

    function setStatus(message, type = "") {
        elements.status.textContent = message;
        elements.status.className = `memory-message${type ? ` memory-message--${type}` : ""}`;
    }

    function finishGame() {
        const result = core.getWinner(state.players);
        elements.resultHeading.textContent = result.tie ? "Je to remíza!" : `Vyhrává ${state.players[result.winner].name}!`;
        elements.resultText.textContent = result.tie ? "Oba jste našli stejně dvojic. Skvělá týmová práce!" : "Gratulujeme! A děkujeme oběma hráčům za krásnou hru.";
        state.players.forEach((player, index) => { elements.resultPlayers[index].textContent = `${player.name}: ${player.score} dvojic`; });
        elements.play.hidden = true;
        elements.result.hidden = false;
        requestAnimationFrame(() => elements.playAgain.focus());
    }

    function showSetup() {
        cancelTurnTimer();
        gameToken += 1;
        state = null;
        elements.play.hidden = true;
        elements.result.hidden = true;
        elements.setup.hidden = false;
        requestAnimationFrame(() => elements.playerInputs[0].focus());
    }

    elements.start.addEventListener("click", startGame);
    elements.newGame.addEventListener("click", showSetup);
    elements.changeGame.addEventListener("click", showSetup);
    elements.playAgain.addEventListener("click", startGame);
    renderOptions();
})(typeof window !== "undefined" ? window : globalThis);
