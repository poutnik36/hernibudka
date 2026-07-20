(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.MirrorCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
    "use strict";

    const DIRECTIONS = {
        up: { row: -1, col: 0 }, right: { row: 0, col: 1 },
        down: { row: 1, col: 0 }, left: { row: 0, col: -1 }
    };

    // Směr označuje pohyb paprsku při příchodu. Každý stav odráží pouze ze své přední strany.
    const MIRROR_TRANSITIONS = {
        0: { right: "up", down: "left", left: "blocked", up: "blocked" },
        1: { left: "down", up: "right", right: "blocked", down: "blocked" },
        2: { right: "down", up: "left", left: "blocked", down: "blocked" },
        3: { left: "up", down: "right", right: "blocked", up: "blocked" }
    };
    const STATE_DESCRIPTIONS = {
        0: "lomítko, odrazová strana pro paprsek přicházející zleva nebo shora",
        1: "lomítko, odrazová strana pro paprsek přicházející zprava nebo zdola",
        2: "obrácené lomítko, odrazová strana pro paprsek přicházející zleva nebo zdola",
        3: "obrácené lomítko, odrazová strana pro paprsek přicházející zprava nebo shora"
    };
    const DIFFICULTIES = {
        easy: { label: "Lehká", size: 5, turns: 2, falseMirrors: 0, maxAttempts: 20 },
        medium: { label: "Střední", size: 7, turns: 4, falseMirrors: 1, maxAttempts: 25 },
        hard: { label: "Těžká", size: 9, turns: 6, falseMirrors: 2, maxAttempts: 30 }
    };

    function simulateBeam(level, mirrorStates = {}, maxSteps) {
        if (!level || !DIRECTIONS[level.source?.direction]) return { result: "invalid", segments: [], visitedStates: [] };
        const mirrors = new Map(level.mirrors.map((mirror) => [`${mirror.row},${mirror.col}`, mirror]));
        const segments = [];
        const visitedStates = [];
        const visited = new Set();
        const limit = maxSteps || (level.rows + 1) * (level.cols + 1) * 4 + 1;
        let row = level.source.row;
        let col = level.source.col;
        let direction = level.source.direction;

        for (let step = 0; step < limit; step += 1) {
            const key = `${row},${col},${direction}`;
            if (visited.has(key)) return { result: "loop", segments, visitedStates };
            visited.add(key);
            visitedStates.push({ row, col, direction });
            const delta = DIRECTIONS[direction];
            const next = { row: row + delta.row, col: col + delta.col };
            segments.push({ from: { row, col }, to: next });
            if (next.row < 0 || next.row > level.rows || next.col < 0 || next.col > level.cols) {
                return { result: "outside", segments, visitedStates };
            }
            row = next.row;
            col = next.col;
            if (row === level.target.row && col === level.target.col && (!level.target.incomingDirection || direction === level.target.incomingDirection)) {
                return { result: "target", segments, visitedStates };
            }
            const mirror = mirrors.get(`${row},${col}`);
            if (mirror) {
                const state = mirrorStates[mirror.id] ?? mirror.state;
                const transition = MIRROR_TRANSITIONS[state]?.[direction];
                if (!transition) return { result: "invalid", segments, visitedStates };
                if (transition === "blocked") return { result: "blocked", segments, visitedStates };
                direction = transition;
            }
        }
        return { result: "invalid", segments, visitedStates };
    }

    function stateForTurn(incoming, outgoing) {
        return [0, 1, 2, 3].find((state) => MIRROR_TRANSITIONS[state][incoming] === outgoing);
    }

    function enumerateSolutions(level, stopAfter = 2, maxCombinations = 20000) {
        const mirrors = level.mirrors.filter((mirror) => !mirror.locked);
        const combinations = mirrors.reduce((total, mirror) => total * mirror.allowedStates.length, 1);
        if (combinations > maxCombinations) return { count: 0, combinations, rejected: true, solution: null };
        let count = 0;
        let solution = null;
        const states = {};

        function visit(index) {
            if (count >= stopAfter) return;
            if (index === mirrors.length) {
                if (simulateBeam(level, states).result === "target") {
                    count += 1;
                    solution = { ...states };
                }
                return;
            }
            const mirror = mirrors[index];
            for (const state of mirror.allowedStates) {
                states[mirror.id] = state;
                visit(index + 1);
                if (count >= stopAfter) break;
            }
        }
        visit(0);
        return { count, combinations, rejected: false, solution };
    }

    function integer(random, minimum, maximum) {
        return minimum + Math.floor(random() * (maximum - minimum + 1));
    }

    function buildCandidate(difficultyId, random = Math.random, serial = 1) {
        const config = DIFFICULTIES[difficultyId] || DIFFICULTIES.easy;
        const rows = config.size;
        const cols = config.size;
        const pairs = config.turns / 2;
        let currentRow = integer(random, 1, rows - 1);
        const sourceRow = currentRow;
        const source = { row: currentRow, col: 0, direction: "right" };
        const mirrors = [];
        const pathPoints = new Set([`${currentRow},0`]);
        let incoming = "right";
        let mirrorNumber = 0;

        for (let pair = 0; pair < pairs; pair += 1) {
            const col = Math.round(((pair + 1) * cols) / (pairs + 1));
            for (let pathCol = pair ? Math.round((pair * cols) / (pairs + 1)) : 0; pathCol <= col; pathCol += 1) pathPoints.add(`${currentRow},${pathCol}`);
            const goUp = currentRow >= rows / 2;
            const nextRow = goUp ? integer(random, 1, Math.max(1, Math.floor(rows / 2) - 1)) : integer(random, Math.ceil(rows / 2) + 1, rows - 1);
            const vertical = goUp ? "up" : "down";
            mirrorNumber += 1;
            const firstSolution = stateForTurn(incoming, vertical);
            mirrors.push({ id: `m${mirrorNumber}`, row: currentRow, col, state: (firstSolution + 2) % 4, solutionState: firstSolution, allowedStates: [0, 1, 2, 3], locked: false });
            const start = Math.min(currentRow, nextRow);
            const end = Math.max(currentRow, nextRow);
            for (let pathRow = start; pathRow <= end; pathRow += 1) pathPoints.add(`${pathRow},${col}`);
            mirrorNumber += 1;
            const secondSolution = stateForTurn(vertical, "right");
            mirrors.push({ id: `m${mirrorNumber}`, row: nextRow, col, state: (secondSolution + 2) % 4, solutionState: secondSolution, allowedStates: [0, 1, 2, 3], locked: false });
            currentRow = nextRow;
            incoming = "right";
        }
        const lastCol = pairs ? Math.round((pairs * cols) / (pairs + 1)) : 0;
        for (let col = lastCol; col <= cols; col += 1) pathPoints.add(`${currentRow},${col}`);
        const target = { row: currentRow, col: cols, incomingDirection: "right" };
        if (target.row === sourceRow) return null;

        let falseAdded = 0;
        for (let attempt = 0; attempt < 60 && falseAdded < config.falseMirrors; attempt += 1) {
            const row = integer(random, 1, rows - 1);
            const col = integer(random, 1, cols - 1);
            const key = `${row},${col}`;
            if (pathPoints.has(key) || mirrors.some((mirror) => mirror.row === row && mirror.col === col)) continue;
            falseAdded += 1;
            const fixedState = falseAdded % 2;
            mirrors.push({ id: `f${falseAdded}`, row, col, state: fixedState, solutionState: fixedState, allowedStates: [fixedState], locked: true });
        }
        if (falseAdded !== config.falseMirrors) return null;
        return { id: `generated-${difficultyId}-${serial}`, difficulty: difficultyId, rows, cols, source, target, mirrors };
    }

    function cloneLevel(level) {
        return JSON.parse(JSON.stringify(level));
    }

    function generateLevel(difficultyId, random = Math.random, fallbacks = {}, validation = {}) {
        const config = DIFFICULTIES[difficultyId] || DIFFICULTIES.easy;
        for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
            const candidate = buildCandidate(difficultyId, random, attempt);
            if (!candidate) continue;
            const check = enumerateSolutions(candidate);
            const initial = Object.fromEntries(candidate.mirrors.map((mirror) => [mirror.id, mirror.state]));
            if (check.count === 1 && simulateBeam(candidate, initial).result !== "target") {
                validation.usedFallback = false;
                validation.attempts = attempt;
                validation.combinations = check.combinations;
                return candidate;
            }
        }
        validation.usedFallback = true;
        validation.attempts = config.maxAttempts;
        const fallback = fallbacks[difficultyId];
        if (!fallback) throw new Error(`Chybí záložní úloha pro ${difficultyId}.`);
        return cloneLevel(fallback);
    }

    function cycleMirror(mirror) {
        const index = mirror.allowedStates.indexOf(mirror.state);
        mirror.state = mirror.allowedStates[(index + 1) % mirror.allowedStates.length];
        return mirror.state;
    }

    function getMirrorVisual(state) {
        return {
            slash: state < 2,
            frontOffset: {
                0: { x: -4, y: -4 },
                1: { x: 4, y: 4 },
                2: { x: -4, y: 4 },
                3: { x: 4, y: -4 }
            }[state]
        };
    }

    return {
        DIRECTIONS, MIRROR_TRANSITIONS, STATE_DESCRIPTIONS, DIFFICULTIES,
        simulateBeam, stateForTurn, enumerateSolutions, buildCandidate, generateLevel, cloneLevel, cycleMirror, getMirrorVisual
    };
});

(function (root) {
    "use strict";
    if (typeof document === "undefined") return;

    const { MirrorCore: core, MIRROR_THEME: theme, MIRROR_FALLBACK_LEVELS: fallbacks } = root;
    if (!theme || !fallbacks) return;
    const SVG_NS = "http://www.w3.org/2000/svg";
    const elements = {
        difficulty: document.querySelector("#difficulty"), board: document.querySelector("#mirror-board"),
        light: document.querySelector("#light-beam"), stop: document.querySelector("#stop-beam"), retry: document.querySelector("#retry-level"),
        newLevel: document.querySelector("#new-level"), hint: document.querySelector("#hint-mirror"), status: document.querySelector("#game-status"),
        attempt: document.querySelector("#attempt-count"), difficultyName: document.querySelector("#difficulty-name")
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let level;
    let mode = "ready";
    let animationTimer = null;
    let animationToken = 0;
    let attemptCount = 0;
    let beamLayer = null;

    function svgElement(name, attributes = {}) {
        const element = document.createElementNS(SVG_NS, name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        return element;
    }

    function pointPosition(row, col) {
        const padding = 70;
        const size = 560;
        return { x: padding + (col / level.cols) * size, y: padding + (row / level.rows) * size };
    }

    function stopAnimation(message = "Paprsek je zastavený. Můžeš zrcadla znovu natočit.") {
        if (animationTimer !== null) window.clearTimeout(animationTimer);
        animationTimer = null;
        animationToken += 1;
        if (mode === "running") mode = "ready";
        updateControls();
        if (message) setStatus(message);
    }

    function setStatus(text, type = "") {
        elements.status.textContent = text;
        elements.status.className = `game-message${type ? ` game-message--${type}` : ""}`;
    }

    function stateName(state) {
        return core.STATE_DESCRIPTIONS[state];
    }

    function updateMirrorAccessibility(group, mirror, index) {
        group.setAttribute("aria-label", `Zrcadlo ${index + 1}: ${stateName(mirror.state)}.${mirror.locked ? " Toto zrcadlo je pevné." : " Aktivací jej otočíš."}`);
    }

    function drawMirror(mirror, index) {
        const position = pointPosition(mirror.row, mirror.col);
        const group = svgElement("g", {
            class: "mirror-control",
            role: mirror.locked ? "img" : "button",
            transform: `translate(${position.x} ${position.y})`
        });
        if (!mirror.locked) group.setAttribute("tabindex", "0");
        group.dataset.mirrorId = mirror.id;
        group.classList.toggle("is-locked", mirror.locked);
        updateMirrorAccessibility(group, mirror, index);
        const hit = svgElement("circle", { r: "28", class: "mirror-hit" });
        const front = svgElement("path", { class: "mirror-front" });
        const back = svgElement("path", { class: "mirror-back" });
        const marker = svgElement("text", { class: "mirror-marker", x: "0", y: "5", "text-anchor": "middle", "aria-hidden": "true" });

        function updateShape() {
            const visual = core.getMirrorVisual(mirror.state);
            const slash = visual.slash;
            const line = slash ? { x1: -18, y1: 18, x2: 18, y2: -18 } : { x1: -18, y1: -18, x2: 18, y2: 18 };
            const perpendicular = visual.frontOffset;
            front.setAttribute("d", `M ${line.x1 + perpendicular.x} ${line.y1 + perpendicular.y} L ${line.x2 + perpendicular.x} ${line.y2 + perpendicular.y}`);
            back.setAttribute("d", `M ${line.x1 - perpendicular.x} ${line.y1 - perpendicular.y} L ${line.x2 - perpendicular.x} ${line.y2 - perpendicular.y}`);
            marker.textContent = slash ? "/" : "\\";
            updateMirrorAccessibility(group, mirror, index);
        }
        group.append(hit, back, front, marker);
        updateShape();
        const activate = () => {
            if (mode === "running" || mirror.locked) return;
            core.cycleMirror(mirror);
            clearBeam();
            elements.retry.disabled = true;
            updateShape();
            setStatus(`Zrcadlo ${index + 1} je otočené. ${stateName(mirror.state)}.`);
        };
        group.addEventListener("pointerup", (event) => { event.preventDefault(); activate(); });
        group.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
        });
        return group;
    }

    function drawEndpoint(endpoint, config, className) {
        const position = pointPosition(endpoint.row, endpoint.col);
        const group = svgElement("g", { class: className, transform: `translate(${position.x} ${position.y})`, role: "img", "aria-label": config.alt });
        const circle = svgElement("circle", { r: "31" });
        const fallback = svgElement("text", { x: "0", y: "10", "text-anchor": "middle", "font-size": "30", "aria-hidden": "true" });
        fallback.textContent = config.fallback;
        group.append(circle, fallback);
        if (config.image) {
            const image = svgElement("image", { href: config.image, x: "-26", y: "-26", width: "52", height: "52", preserveAspectRatio: "xMidYMid meet", opacity: "0", "aria-hidden": "true" });
            image.addEventListener("load", () => { image.setAttribute("opacity", "1"); fallback.setAttribute("opacity", "0"); }, { once: true });
            image.addEventListener("error", () => image.remove(), { once: true });
            group.append(image);
        }
        return group;
    }

    function renderBoard() {
        elements.board.replaceChildren();
        const background = svgElement("rect", { x: "35", y: "35", width: "630", height: "630", rx: "28", class: "board-background" });
        elements.board.append(background);
        const grid = svgElement("g", { class: "grid-lines", "aria-hidden": "true" });
        for (let row = 0; row <= level.rows; row += 1) {
            const from = pointPosition(row, 0); const to = pointPosition(row, level.cols);
            grid.append(svgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y }));
        }
        for (let col = 0; col <= level.cols; col += 1) {
            const from = pointPosition(0, col); const to = pointPosition(level.rows, col);
            grid.append(svgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y }));
        }
        elements.board.append(grid);
        beamLayer = svgElement("g", { class: "beam-layer", "aria-hidden": "true" });
        elements.board.append(beamLayer);
        level.mirrors.forEach((mirror, index) => elements.board.append(drawMirror(mirror, index)));
        elements.board.append(drawEndpoint(level.source, theme.flashlight, "source-marker"));
        elements.board.append(drawEndpoint(level.target, theme.target, "target-marker"));
    }

    function clearBeam() {
        beamLayer?.replaceChildren();
    }

    function drawSegment(segment) {
        const from = pointPosition(segment.from.row, segment.from.col);
        const to = pointPosition(segment.to.row, segment.to.col);
        beamLayer.append(svgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: "beam-segment" }));
    }

    function currentStates() {
        return Object.fromEntries(level.mirrors.map((mirror) => [mirror.id, mirror.state]));
    }

    function launchBeam() {
        if (mode === "running") return;
        stopAnimation("");
        clearBeam();
        mode = "running";
        attemptCount += 1;
        elements.attempt.textContent = attemptCount;
        const simulation = core.simulateBeam(level, currentStates());
        const token = ++animationToken;
        let index = 0;
        updateControls();
        setStatus("Paprsek letí po mřížce…");
        const next = () => {
            if (token !== animationToken || mode !== "running") return;
            if (index < simulation.segments.length) {
                drawSegment(simulation.segments[index]);
                index += 1;
                animationTimer = window.setTimeout(next, reducedMotion ? 35 : 145);
                return;
            }
            animationTimer = null;
            mode = simulation.result === "target" ? "success" : "ready";
            finishAttempt(simulation.result);
        };
        next();
    }

    function finishAttempt(result) {
        const messages = {
            target: ["Výborně! Paprsek dorazil až do cíle! ✨", "success"],
            blocked: ["Paprsek narazil na zadní stranu zrcadla. Otoč některé zrcadlo a zkus to znovu.", "error"],
            outside: ["Paprsek vyletěl z mřížky. Zkus zrcadla natočit jinak.", "error"],
            loop: ["Paprsek se chytil do smyčky. Jedno zrcadlo potřebuje jiný směr.", "error"],
            invalid: ["Paprsek nenašel bezpečnou cestu. Zkus jiné natočení.", "error"]
        };
        setStatus(...messages[result]);
        elements.retry.disabled = result === "target";
        updateControls();
    }

    function updateControls() {
        const running = mode === "running";
        elements.light.disabled = running || mode === "success";
        elements.stop.disabled = !running;
        elements.newLevel.disabled = running;
        elements.difficulty.disabled = running;
        elements.hint.disabled = running || mode === "success";
        elements.board.classList.toggle("is-locked", running);
        elements.board.querySelectorAll(".mirror-control").forEach((mirror) => mirror.setAttribute("aria-disabled", String(running)));
    }

    function newLevel() {
        stopAnimation("");
        const validation = {};
        level = core.generateLevel(elements.difficulty.value, Math.random, fallbacks, validation);
        mode = "ready";
        attemptCount = 0;
        elements.attempt.textContent = "0";
        elements.difficultyName.textContent = core.DIFFICULTIES[level.difficulty].label;
        renderBoard();
        updateControls();
        setStatus("Natoč zrcadla a potom rozsviť baterku.");
    }

    function retryLevel() {
        stopAnimation("");
        clearBeam();
        mode = "ready";
        elements.retry.disabled = true;
        updateControls();
        setStatus("Zrcadla můžeš upravit a zkusit stejnou úlohu znovu.");
        elements.board.querySelector(".mirror-control")?.focus();
    }

    function showHint() {
        if (mode === "running") return;
        const wrong = level.mirrors.find((mirror) => mirror.state !== mirror.solutionState && mirror.id.startsWith("m"));
        if (!wrong) {
            setStatus("Všechna důležitá zrcadla vypadají správně. Zkus rozsvítit baterku!", "success");
            return;
        }
        const group = elements.board.querySelector(`[data-mirror-id="${wrong.id}"]`);
        group?.classList.add("is-hinted");
        window.setTimeout(() => group?.classList.remove("is-hinted"), reducedMotion ? 500 : 1600);
        setStatus("Jedno zrcadlo, které stojí za kontrolu, krátce zablikalo.");
    }

    elements.light.addEventListener("click", launchBeam);
    elements.stop.addEventListener("click", () => stopAnimation());
    elements.retry.addEventListener("click", retryLevel);
    elements.newLevel.addEventListener("click", newLevel);
    elements.hint.addEventListener("click", showHint);
    elements.difficulty.addEventListener("change", newLevel);
    newLevel();
})(typeof window !== "undefined" ? window : globalThis);
