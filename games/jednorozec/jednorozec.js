(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.UnicornCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
    "use strict";

    const DIFFICULTIES = {
        easy: { label: "Lehká", speed: 125, gapHeight: 225, gravity: 610, impulse: -310, spacing: 335, maxGapShift: 75 },
        medium: { label: "Střední", speed: 160, gapHeight: 190, gravity: 790, impulse: -355, spacing: 310, maxGapShift: 90 },
        hard: { label: "Těžká", speed: 185, gapHeight: 170, gravity: 900, impulse: -380, spacing: 290, maxGapShift: 90 }
    };
    const HITBOX = { offsetX: 11, offsetY: 9, width: 50, height: 35 };
    const PLAYER = { width: 72, height: 54 };

    const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

    function createObstacle(id, x, gapTop, difficulty, variant = 0) {
        return { id: `obstacle-${id}`, x, width: 120, gapTop, gapHeight: difficulty.gapHeight, counted: false, variant };
    }

    function createCloudLayout(blockWidth, blockHeight, imageAspectRatio = 1.75, anchorAtEnd = false) {
        const cloudWidth = blockWidth / 3;
        const cloudHeight = cloudWidth / imageAspectRatio;
        const horizontalStep = cloudWidth / 2;
        const verticalStep = cloudHeight / 2;
        const rowCount = Math.max(1, Math.ceil(Math.max(0, blockHeight - cloudHeight) / verticalStep) + 1);
        const firstRowY = anchorAtEnd ? blockHeight - cloudHeight : 0;
        return {
            cloudWidth,
            cloudHeight,
            columns: Array.from({ length: 5 }, (_, index) => index * horizontalStep),
            rows: Array.from({ length: rowCount }, (_, index) => firstRowY + (anchorAtEnd ? -1 : 1) * index * verticalStep)
        };
    }

    function nextGapTop(previous, difficulty, height, random = Math.random) {
        const margin = 48;
        const maximum = height - difficulty.gapHeight - margin;
        const safeCenter = (height - difficulty.gapHeight) / 2;
        if (!Number.isFinite(previous)) return clamp(safeCenter, margin, maximum);
        const shift = (random() * 2 - 1) * difficulty.maxGapShift;
        return clamp(previous + shift, margin, maximum);
    }

    function createState(difficultyId = "easy", bestScore = 0, gameToken = 1, random = Math.random) {
        const difficulty = DIFFICULTIES[difficultyId] || DIFFICULTIES.easy;
        const width = 800;
        const height = 500;
        const obstacles = [];
        let gapTop = nextGapTop(null, difficulty, height, random);
        for (let index = 0; index < 3; index += 1) {
            obstacles.push(createObstacle(index + 1, 650 + index * difficulty.spacing, gapTop, difficulty, index % 2));
            gapTop = nextGapTop(gapTop, difficulty, height, random);
        }
        return {
            mode: "ready", difficulty: difficultyId, score: 0, bestScore, gameToken,
            width, height, obstacleCounter: 3, trailAccumulator: 0,
            unicorn: { x: 145, y: height / 2 - PLAYER.height / 2, velocityY: 0, rotation: 0 },
            obstacles, trail: []
        };
    }

    function flap(state) {
        if (state.mode !== "playing") return false;
        state.unicorn.velocityY = DIFFICULTIES[state.difficulty].impulse;
        return true;
    }

    function getHitbox(unicorn) {
        return {
            x: unicorn.x + HITBOX.offsetX,
            y: unicorn.y + HITBOX.offsetY,
            width: HITBOX.width,
            height: HITBOX.height
        };
    }

    function rectanglesOverlap(first, second) {
        return first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y;
    }

    function hasCollision(state) {
        const hitbox = getHitbox(state.unicorn);
        if (hitbox.y <= 0 || hitbox.y + hitbox.height >= state.height) return true;
        return state.obstacles.some((obstacle) => {
            const top = { x: obstacle.x, y: 0, width: obstacle.width, height: obstacle.gapTop };
            const bottomY = obstacle.gapTop + obstacle.gapHeight;
            const bottom = { x: obstacle.x, y: bottomY, width: obstacle.width, height: state.height - bottomY };
            return rectanglesOverlap(hitbox, top) || rectanglesOverlap(hitbox, bottom);
        });
    }

    function updateTrail(state, deltaTime, reducedMotion = false) {
        const maxAge = reducedMotion ? 0.38 : 0.78;
        state.trail.forEach((point) => { point.age += deltaTime; point.x -= DIFFICULTIES[state.difficulty].speed * deltaTime * 0.16; });
        state.trail = state.trail.filter((point) => point.age < point.maxAge);
        state.trailAccumulator += deltaTime;
        const interval = reducedMotion ? 0.075 : 0.025;
        if (state.trailAccumulator >= interval) {
            state.trailAccumulator %= interval;
            state.trail.push({ x: state.unicorn.x + 8, y: state.unicorn.y + PLAYER.height * 0.62, age: 0, maxAge, width: reducedMotion ? 10 : 16 });
        }
        if (state.trail.length > 40) state.trail.splice(0, state.trail.length - 40);
    }

    function step(state, rawDeltaTime, random = Math.random, reducedMotion = false) {
        const events = { points: 0, collision: false };
        if (state.mode !== "playing") return events;
        const deltaTime = clamp(rawDeltaTime, 0, 0.04);
        const difficulty = DIFFICULTIES[state.difficulty];
        state.unicorn.velocityY += difficulty.gravity * deltaTime;
        state.unicorn.y += state.unicorn.velocityY * deltaTime;
        state.unicorn.rotation = clamp(state.unicorn.velocityY / 650, -0.42, 0.65);
        state.obstacles.forEach((obstacle) => { obstacle.x -= difficulty.speed * deltaTime; });
        updateTrail(state, deltaTime, reducedMotion);

        if (hasCollision(state)) {
            state.mode = "gameOver";
            events.collision = true;
            return events;
        }

        const hitbox = getHitbox(state.unicorn);
        state.obstacles.forEach((obstacle) => {
            if (!obstacle.counted && obstacle.x + obstacle.width < hitbox.x) {
                obstacle.counted = true;
                state.score += 1;
                events.points += 1;
            }
        });
        state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -20);
        const last = state.obstacles[state.obstacles.length - 1];
        if (!last || last.x <= state.width - difficulty.spacing) {
            const previousGap = last?.gapTop;
            state.obstacleCounter += 1;
            state.obstacles.push(createObstacle(
                state.obstacleCounter,
                last ? last.x + difficulty.spacing : state.width + 40,
                nextGapTop(previousGap, difficulty, state.height, random),
                difficulty,
                state.obstacleCounter % 2
            ));
        }
        return events;
    }

    return { DIFFICULTIES, HITBOX, PLAYER, clamp, createObstacle, createCloudLayout, nextGapTop, createState, flap, getHitbox, rectanglesOverlap, hasCollision, updateTrail, step };
});

(function (root) {
    "use strict";
    if (typeof document === "undefined") return;

    const { UnicornCore: core, UNICORN_THEME: theme } = root;
    if (!theme) return;
    const elements = {
        canvas: document.querySelector("#game-canvas"), frame: document.querySelector("#canvas-frame"),
        difficulty: document.querySelector("#difficulty"), score: document.querySelector("#score"), best: document.querySelector("#best-score"),
        ready: document.querySelector("#ready-overlay"), gameOver: document.querySelector("#game-over-overlay"),
        start: document.querySelector("#start-game"), playAgain: document.querySelector("#play-again"), newGame: document.querySelector("#new-game"),
        finalResult: document.querySelector("#final-result"), gameOverHeading: document.querySelector("#game-over-heading"), status: document.querySelector("#game-status")
    };
    const context = elements.canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const images = { player: [], clouds: [], background: null };
    let state;
    let animationFrame = 0;
    let lastFrameTime = 0;
    let tokenCounter = 0;
    let resumeAfterVisibility = false;

    function loadImage(path, onSuccess) {
        if (!path) return;
        const image = new Image();
        image.addEventListener("load", () => { onSuccess(image); render(); }, { once: true });
        image.addEventListener("error", () => {}, { once: true });
        image.src = path;
    }

    loadImage(theme.player.idleImage, (image) => { images.player[0] = image; });
    loadImage(theme.player.flapUpImage, (image) => { images.player[1] = image; });
    loadImage(theme.player.flapDownImage, (image) => { images.player[2] = image; });
    theme.cloud.images.forEach((path, index) => loadImage(path, (image) => { images.clouds[index] = image; }));
    loadImage(theme.background.image, (image) => { images.background = image; });

    function readBestScore() {
        try { return Math.max(0, Number.parseInt(localStorage.getItem("herniBudka.unicorn.bestScore"), 10) || 0); }
        catch (error) { return 0; }
    }

    function saveBestScore(score) {
        try { localStorage.setItem("herniBudka.unicorn.bestScore", String(score)); }
        catch (error) { /* Hra zůstane funkční i při zakázaném úložišti. */ }
    }

    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        elements.canvas.width = Math.round(800 * dpr);
        elements.canvas.height = Math.round(500 * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        render();
    }

    function setStatus(text, type = "") {
        elements.status.textContent = text;
        elements.status.className = `game-message${type ? ` game-message--${type}` : ""}`;
    }

    function stopLoop() {
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
    }

    function prepareGame() {
        stopLoop();
        tokenCounter += 1;
        state = core.createState(elements.difficulty.value, readBestScore(), tokenCounter);
        elements.score.textContent = "0";
        elements.best.textContent = state.bestScore;
        elements.difficulty.disabled = false;
        elements.ready.hidden = false;
        elements.gameOver.hidden = true;
        setStatus("Vyber obtížnost a spusť hru.");
        render();
    }

    function startGame() {
        if (state.mode !== "ready") return;
        stopLoop();
        state.mode = "playing";
        elements.ready.hidden = true;
        elements.gameOver.hidden = true;
        elements.difficulty.disabled = true;
        core.flap(state);
        lastFrameTime = performance.now();
        setStatus("Leť mezi obláčky! Každý průlet znamená jeden bod.");
        elements.canvas.focus({ preventScroll: true });
        const token = state.gameToken;
        animationFrame = window.requestAnimationFrame((time) => frame(time, token));
    }

    function frame(time, token) {
        if (token !== state.gameToken || state.mode !== "playing") return;
        const deltaTime = (time - lastFrameTime) / 1000;
        lastFrameTime = time;
        const events = core.step(state, deltaTime, Math.random, reducedMotion);
        if (events.points) {
            elements.score.textContent = state.score;
            setStatus(`Výborně! Máš ${state.score} ${state.score === 1 ? "bod" : state.score < 5 ? "body" : "bodů"}.`, "point");
        }
        render();
        if (events.collision) finishGame();
        else animationFrame = window.requestAnimationFrame((nextTime) => frame(nextTime, token));
    }

    function finishGame() {
        stopLoop();
        if (state.score > state.bestScore) {
            state.bestScore = state.score;
            saveBestScore(state.score);
            elements.best.textContent = state.bestScore;
            elements.gameOverHeading.textContent = "Nový nejlepší výsledek!";
        } else {
            elements.gameOverHeading.textContent = state.score ? "Krásný let!" : "Zkus to ještě jednou!";
        }
        elements.finalResult.textContent = `Získal jsi ${state.score} ${state.score === 1 ? "bod" : state.score < 5 ? "body" : "bodů"}. Nejlepší skóre je ${state.bestScore}.`;
        elements.difficulty.disabled = false;
        elements.gameOver.hidden = false;
        setStatus("Let skončil, ale duha nikam neutekla. Můžeš to zkusit znovu!", "error");
        requestAnimationFrame(() => elements.playAgain.focus());
    }

    function flap() {
        if (state.mode === "playing") core.flap(state);
    }

    function restartAndPlay() {
        prepareGame();
        startGame();
    }

    function drawBackground() {
        if (images.background) context.drawImage(images.background, 0, 0, state.width, state.height);
        else {
            const gradient = context.createLinearGradient(0, 0, 0, state.height);
            gradient.addColorStop(0, theme.background.fallbackColors[0]);
            gradient.addColorStop(1, theme.background.fallbackColors[1]);
            context.fillStyle = gradient;
            context.fillRect(0, 0, state.width, state.height);
            context.fillStyle = "rgba(255,255,255,.4)";
            for (let index = 0; index < 7; index += 1) {
                context.beginPath();
                context.arc(70 + index * 130, 65 + (index % 3) * 42, 24 + (index % 2) * 8, 0, Math.PI * 2);
                context.fill();
            }
        }
    }

    function drawTrail() {
        const colors = ["#ef476f", "#ff9f1c", "#ffd166", "#62c370", "#3a86ff", "#9b5de5"];
        state.trail.forEach((point) => {
            const opacity = Math.max(0, 1 - point.age / point.maxAge) * .72;
            colors.forEach((color, index) => {
                context.strokeStyle = color;
                context.globalAlpha = opacity;
                context.lineWidth = 3;
                context.beginPath();
                context.moveTo(point.x - point.width, point.y + index * 3 - 8);
                context.lineTo(point.x, point.y + index * 3 - 8);
                context.stroke();
            });
        });
        context.globalAlpha = 1;
    }

    function drawFallbackCloud(x, y, width, height, variant) {
        context.fillStyle = variant ? "#f6a9ef" : "#ffffff";
        context.strokeStyle = "#304a57";
        context.lineWidth = Math.max(1, width * .035);
        context.beginPath();
        context.ellipse(x + width * .24, y + height * .62, width * .23, height * .3, 0, 0, Math.PI * 2);
        context.ellipse(x + width * .5, y + height * .46, width * .3, height * .42, 0, 0, Math.PI * 2);
        context.ellipse(x + width * .76, y + height * .62, width * .23, height * .3, 0, 0, Math.PI * 2);
        context.fill();
        context.stroke();
    }

    function drawCloudBlock(obstacle, y, height, anchorAtEnd) {
        if (height <= 0) return;
        const cloudImage = images.clouds[obstacle.variant];
        const aspectRatio = cloudImage?.naturalWidth && cloudImage?.naturalHeight ? cloudImage.naturalWidth / cloudImage.naturalHeight : 1.75;
        const layout = core.createCloudLayout(obstacle.width, height, aspectRatio, anchorAtEnd);
        context.save();
        context.beginPath();
        context.rect(obstacle.x, y, obstacle.width, height);
        context.clip();
        // Kreslení odzadu dopředu ponechá první obláček v řádku i u průletové hrany celý nahoře.
        for (let row = layout.rows.length - 1; row >= 0; row -= 1) {
            for (let column = layout.columns.length - 1; column >= 0; column -= 1) {
                const cloudX = obstacle.x + layout.columns[column];
                const cloudY = y + layout.rows[row];
                if (cloudImage) context.drawImage(cloudImage, cloudX, cloudY, layout.cloudWidth, layout.cloudHeight);
                else drawFallbackCloud(cloudX, cloudY, layout.cloudWidth, layout.cloudHeight, obstacle.variant);
            }
        }
        context.restore();
    }

    function drawObstacles() {
        state.obstacles.forEach((obstacle) => {
            drawCloudBlock(obstacle, 0, obstacle.gapTop, true);
            const bottomY = obstacle.gapTop + obstacle.gapHeight;
            drawCloudBlock(obstacle, bottomY, state.height - bottomY, false);
        });
    }

    function drawUnicorn() {
        const unicorn = state.unicorn;
        context.save();
        context.translate(unicorn.x + core.PLAYER.width / 2, unicorn.y + core.PLAYER.height / 2);
        context.rotate(unicorn.rotation);
        const imageIndex = unicorn.velocityY < -80 ? 1 : unicorn.velocityY > 180 ? 2 : 0;
        const image = images.player[imageIndex] || images.player[0];
        if (image) context.drawImage(image, -core.PLAYER.width / 2, -core.PLAYER.height / 2, core.PLAYER.width, core.PLAYER.height);
        else {
            context.font = "52px system-ui";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(theme.player.fallback, 0, 0);
        }
        context.restore();
    }

    function render() {
        if (!state || !context) return;
        context.clearRect(0, 0, state.width, state.height);
        drawBackground();
        drawTrail();
        drawObstacles();
        drawUnicorn();
    }

    elements.canvas.addEventListener("pointerdown", (event) => {
        if (state.mode !== "playing") return;
        event.preventDefault();
        elements.canvas.setPointerCapture?.(event.pointerId);
        flap();
    });
    document.addEventListener("keydown", (event) => {
        if (!["Space", "ArrowUp", "KeyW"].includes(event.code)) return;
        const tag = document.activeElement?.tagName;
        if (["INPUT", "SELECT", "BUTTON", "A"].includes(tag)) return;
        if (state.mode === "playing") {
            event.preventDefault();
            flap();
        } else if (state.mode === "ready") {
            event.preventDefault();
            startGame();
        }
    });
    elements.start.addEventListener("click", startGame);
    elements.playAgain.addEventListener("click", restartAndPlay);
    elements.newGame.addEventListener("click", prepareGame);
    elements.difficulty.addEventListener("change", prepareGame);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state.mode === "playing") {
            resumeAfterVisibility = true;
            state.mode = "paused";
            stopLoop();
            setStatus("Hra je pozastavená, dokud se nevrátíš.");
        } else if (!document.hidden && resumeAfterVisibility && state.mode === "paused") {
            resumeAfterVisibility = false;
            state.mode = "playing";
            lastFrameTime = performance.now();
            const token = state.gameToken;
            animationFrame = window.requestAnimationFrame((time) => frame(time, token));
            setStatus("Pokračujeme v duhovém letu!");
        }
    });
    window.addEventListener("resize", resizeCanvas);
    prepareGame();
    resizeCanvas();
})(typeof window !== "undefined" ? window : globalThis);
