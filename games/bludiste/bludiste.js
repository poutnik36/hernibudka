"use strict";

(function initializeMazeGame(globalScope) {
    const DIRECTIONS = Object.freeze({
        top: Object.freeze({ row: -1, col: 0, opposite: "bottom" }),
        right: Object.freeze({ row: 0, col: 1, opposite: "left" }),
        bottom: Object.freeze({ row: 1, col: 0, opposite: "top" }),
        left: Object.freeze({ row: 0, col: -1, opposite: "right" })
    });

    const DIFFICULTIES = Object.freeze({
        easy: Object.freeze({ size: 7, label: "Lehká" }),
        medium: Object.freeze({ size: 11, label: "Střední" }),
        hard: Object.freeze({ size: 15, label: "Těžká" })
    });

    function cellIndex(row, col, size) {
        return row * size + col;
    }

    function positionKey(position) {
        return `${position.row}:${position.col}`;
    }

    function shuffle(items, random = Math.random) {
        const result = [...items];
        for (let index = result.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(random() * (index + 1));
            [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
        }
        return result;
    }

    function createCell(row, col) {
        return {
            row,
            col,
            walls: { top: true, right: true, bottom: true, left: true },
            visited: false
        };
    }

    function getCell(maze, row, col) {
        if (row < 0 || row >= maze.size || col < 0 || col >= maze.size) return null;
        return maze.cells[cellIndex(row, col, maze.size)];
    }

    function getOpenNeighbors(maze, position) {
        const cell = getCell(maze, position.row, position.col);
        if (!cell) return [];
        return Object.entries(DIRECTIONS)
            .filter(([direction]) => !cell.walls[direction])
            .map(([, movement]) => ({
                row: position.row + movement.row,
                col: position.col + movement.col
            }))
            .filter((neighbor) => getCell(maze, neighbor.row, neighbor.col));
    }

    function findFarthestCell(maze, start) {
        const queue = [{ position: { ...start }, distance: 0 }];
        const visited = new Set([positionKey(start)]);
        let farthest = queue[0];

        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const current = queue[cursor];
            if (current.distance > farthest.distance) farthest = current;
            for (const neighbor of getOpenNeighbors(maze, current.position)) {
                const key = positionKey(neighbor);
                if (visited.has(key)) continue;
                visited.add(key);
                queue.push({ position: neighbor, distance: current.distance + 1 });
            }
        }

        return { ...farthest, visitedCount: visited.size };
    }

    function findPath(maze, start = maze.start, goal = maze.goal) {
        const queue = [{ ...start }];
        const visited = new Set([positionKey(start)]);
        const previous = new Map();

        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const current = queue[cursor];
            if (positionKey(current) === positionKey(goal)) break;
            for (const neighbor of getOpenNeighbors(maze, current)) {
                const key = positionKey(neighbor);
                if (visited.has(key)) continue;
                visited.add(key);
                previous.set(key, current);
                queue.push(neighbor);
            }
        }

        if (!visited.has(positionKey(goal))) return [];
        const path = [{ ...goal }];
        while (positionKey(path[path.length - 1]) !== positionKey(start)) {
            const parent = previous.get(positionKey(path[path.length - 1]));
            if (!parent) return [];
            path.push({ ...parent });
        }
        return path.reverse();
    }

    function validateMaze(maze) {
        if (!maze || !Number.isInteger(maze.size) || maze.size < 2) return false;
        if (!Array.isArray(maze.cells) || maze.cells.length !== maze.size * maze.size) return false;

        for (const cell of maze.cells) {
            if (cell.row === 0 && !cell.walls.top) return false;
            if (cell.col === 0 && !cell.walls.left) return false;
            if (cell.row === maze.size - 1 && !cell.walls.bottom) return false;
            if (cell.col === maze.size - 1 && !cell.walls.right) return false;

            for (const [direction, movement] of Object.entries(DIRECTIONS)) {
                const neighbor = getCell(maze, cell.row + movement.row, cell.col + movement.col);
                if (neighbor && cell.walls[direction] !== neighbor.walls[movement.opposite]) return false;
            }
        }

        const farthest = findFarthestCell(maze, maze.start);
        return farthest.visitedCount === maze.cells.length
            && findPath(maze).length > 1
            && positionKey(maze.start) !== positionKey(maze.goal);
    }

    function generateMaze(difficulty = "easy", random = Math.random) {
        const settings = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
        const cells = [];
        for (let row = 0; row < settings.size; row += 1) {
            for (let col = 0; col < settings.size; col += 1) cells.push(createCell(row, col));
        }

        const maze = { size: settings.size, cells, start: null, goal: null, solutionLength: 0 };
        const generationStart = {
            row: Math.floor(random() * settings.size),
            col: Math.floor(random() * settings.size)
        };
        const stack = [generationStart];
        getCell(maze, generationStart.row, generationStart.col).visited = true;
        let visitedCount = 1;
        const safeStepLimit = settings.size * settings.size * 8;
        let steps = 0;

        while (stack.length > 0 && steps < safeStepLimit) {
            steps += 1;
            const currentPosition = stack[stack.length - 1];
            const currentCell = getCell(maze, currentPosition.row, currentPosition.col);
            const candidates = shuffle(Object.entries(DIRECTIONS), random)
                .map(([direction, movement]) => ({
                    direction,
                    movement,
                    row: currentPosition.row + movement.row,
                    col: currentPosition.col + movement.col
                }))
                .filter((candidate) => {
                    const cell = getCell(maze, candidate.row, candidate.col);
                    return cell && !cell.visited;
                });

            if (candidates.length === 0) {
                stack.pop();
                continue;
            }

            const next = candidates[0];
            const nextCell = getCell(maze, next.row, next.col);
            currentCell.walls[next.direction] = false;
            nextCell.walls[next.movement.opposite] = false;
            nextCell.visited = true;
            visitedCount += 1;
            stack.push({ row: next.row, col: next.col });
        }

        if (visitedCount !== cells.length) {
            throw new Error("Generátor bludiště nedokončil všechny buňky v bezpečném limitu.");
        }

        const corners = [
            { row: 0, col: 0 },
            { row: 0, col: settings.size - 1 },
            { row: settings.size - 1, col: 0 },
            { row: settings.size - 1, col: settings.size - 1 }
        ];
        maze.start = { ...corners[Math.floor(random() * corners.length)] };
        const farthest = findFarthestCell(maze, maze.start);
        maze.goal = { ...farthest.position };
        maze.solutionLength = farthest.distance;
        cells.forEach((cell) => { delete cell.visited; });

        if (!validateMaze(maze)) throw new Error("Vygenerované bludiště neprošlo kontrolou.");
        return maze;
    }

    function buildWallSegments(maze) {
        const segments = [];
        for (const cell of maze.cells) {
            const { row, col, walls } = cell;
            if (walls.top) segments.push({ x1: col, y1: row, x2: col + 1, y2: row });
            if (walls.left) segments.push({ x1: col, y1: row, x2: col, y2: row + 1 });
            if (row === maze.size - 1 && walls.bottom) {
                segments.push({ x1: col, y1: row + 1, x2: col + 1, y2: row + 1 });
            }
            if (col === maze.size - 1 && walls.right) {
                segments.push({ x1: col + 1, y1: row, x2: col + 1, y2: row + 1 });
            }
        }
        return segments;
    }

    function distanceToSegment(point, segment) {
        const deltaX = segment.x2 - segment.x1;
        const deltaY = segment.y2 - segment.y1;
        const lengthSquared = deltaX * deltaX + deltaY * deltaY;
        if (lengthSquared === 0) return Math.hypot(point.x - segment.x1, point.y - segment.y1);
        const projection = Math.max(0, Math.min(1,
            ((point.x - segment.x1) * deltaX + (point.y - segment.y1) * deltaY) / lengthSquared));
        const nearestX = segment.x1 + projection * deltaX;
        const nearestY = segment.y1 + projection * deltaY;
        return Math.hypot(point.x - nearestX, point.y - nearestY);
    }

    function isPointAllowed(point, maze, wallSegments, clearance = 0.1) {
        if (point.x < clearance || point.y < clearance
            || point.x > maze.size - clearance || point.y > maze.size - clearance) return false;
        return wallSegments.every((segment) => distanceToSegment(point, segment) >= clearance);
    }

    function sampleMovement(from, to, isAllowed, sampleSpacing = 0.045) {
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        const sampleCount = Math.max(1, Math.ceil(distance / sampleSpacing));
        let lastValid = { ...from };

        for (let index = 1; index <= sampleCount; index += 1) {
            const ratio = index / sampleCount;
            const point = {
                x: from.x + (to.x - from.x) * ratio,
                y: from.y + (to.y - from.y) * ratio
            };
            if (!isAllowed(point)) {
                return { valid: false, lastValid, invalidPoint: point, samplesChecked: index };
            }
            lastValid = point;
        }

        return { valid: true, lastValid, invalidPoint: null, samplesChecked: sampleCount };
    }

    const coreApi = Object.freeze({
        DIRECTIONS,
        DIFFICULTIES,
        generateMaze,
        validateMaze,
        findPath,
        findFarthestCell,
        getOpenNeighbors,
        buildWallSegments,
        distanceToSegment,
        isPointAllowed,
        sampleMovement
    });

    globalScope.MazeGameCore = coreApi;
    if (typeof module !== "undefined" && module.exports) module.exports = coreApi;
    if (typeof document === "undefined") return;

    document.addEventListener("DOMContentLoaded", () => {
        const theme = globalScope.MAZE_THEME || {
            player: { fallback: "🥕", alt: "Mrkev" },
            goal: { fallback: "🐰", alt: "Zajíček" },
            background: { fallbackColor: "#f8f1d4" },
            walls: { color: "#245b3d", accentColor: "#173c33" },
            trailColor: "#ef7d31"
        };
        const canvas = document.querySelector("#maze-canvas");
        const frame = document.querySelector("#canvas-frame");
        const context = canvas?.getContext("2d");
        const elements = {
            difficulty: document.querySelector("#difficulty"),
            newMaze: document.querySelector("#new-maze"),
            nextMaze: document.querySelector("#next-maze"),
            clearTrail: document.querySelector("#clear-trail"),
            message: document.querySelector("#maze-message"),
            mazeSize: document.querySelector("#maze-size")
        };
        if (!canvas || !frame || !context || Object.values(elements).some((element) => !element)) return;
        canvas.setAttribute(
            "aria-label",
            `Bludiště. Veď ${theme.player?.alt || "hráče"} chodbami k cíli ${theme.goal?.alt || "cíl"}. Použít můžeš také šipky na klávesnici.`
        );

        const state = {
            maze: null,
            walls: [],
            player: null,
            trail: [],
            dragging: false,
            pointerId: null,
            complete: false,
            cssSize: 0,
            assets: { player: null, goal: null, background: null, walls: null },
            bumpTimer: null
        };
        const collisionClearance = 0.1;

        function cellCenter(position) {
            return { x: position.col + 0.5, y: position.row + 0.5 };
        }

        function setMessage(text, type = "info") {
            elements.message.textContent = text;
            elements.message.classList.toggle("maze-message--success", type === "success");
            elements.message.classList.toggle("maze-message--error", type === "error");
        }

        function loadImageIfAvailable(url, onReady) {
            if (!url || typeof globalScope.fetch !== "function") return;
            globalScope.fetch(url, { method: "HEAD", cache: "force-cache" })
                .then((response) => {
                    if (!response.ok) return;
                    const image = new Image();
                    image.addEventListener("load", () => onReady(image), { once: true });
                    image.src = url;
                })
                .catch(() => {});
        }

        function loadThemeAssets() {
            loadImageIfAvailable(theme.player?.image, (image) => { state.assets.player = image; render(); });
            loadImageIfAvailable(theme.goal?.image, (image) => { state.assets.goal = image; render(); });
            loadImageIfAvailable(theme.background?.image, (image) => { state.assets.background = image; render(); });
            loadImageIfAvailable(theme.walls?.image, (image) => { state.assets.walls = image; render(); });
        }

        function resizeCanvas() {
            const rectangle = canvas.getBoundingClientRect();
            const nextSize = Math.max(1, rectangle.width);
            const pixelRatio = Math.min(globalScope.devicePixelRatio || 1, 3);
            state.cssSize = nextSize;
            canvas.width = Math.round(nextSize * pixelRatio);
            canvas.height = Math.round(nextSize * pixelRatio);
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            render();
        }

        function drawContainedImage(image, centerX, centerY, maxSize) {
            const scale = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight);
            const width = image.naturalWidth * scale;
            const height = image.naturalHeight * scale;
            context.drawImage(image, centerX - width / 2, centerY - height / 2, width, height);
        }

        function drawCharacter(asset, config, point, cellSize, fallbackScale = 0.58) {
            const centerX = point.x * cellSize;
            const centerY = point.y * cellSize;
            const visualSize = Math.max(12, cellSize * fallbackScale);
            if (asset) {
                drawContainedImage(asset, centerX, centerY, visualSize);
                return;
            }
            context.save();
            context.font = `${visualSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(config?.fallback || "?", centerX, centerY);
            context.restore();
        }

        function drawBackground() {
            const fallbackColor = theme.background?.fallbackColor || "#f8f1d4";
            context.fillStyle = fallbackColor;
            context.fillRect(0, 0, state.cssSize, state.cssSize);
            if (state.assets.background) {
                context.save();
                context.globalAlpha = 0.2;
                context.drawImage(state.assets.background, 0, 0, state.cssSize, state.cssSize);
                context.restore();
            }
        }

        function drawCellPattern(cellSize) {
            context.save();
            context.fillStyle = "rgba(59, 134, 47, 0.06)";
            for (let row = 0; row < state.maze.size; row += 1) {
                for (let col = 0; col < state.maze.size; col += 1) {
                    if ((row + col) % 2 === 0) {
                        context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                    }
                }
            }
            context.restore();
        }

        function drawTrail(cellSize) {
            if (state.trail.length < 2) return;
            context.save();
            context.strokeStyle = theme.trailColor || "#ef7d31";
            context.lineWidth = Math.max(3, cellSize * 0.16);
            context.lineCap = "round";
            context.lineJoin = "round";
            context.beginPath();
            context.moveTo(state.trail[0].x * cellSize, state.trail[0].y * cellSize);
            for (let index = 1; index < state.trail.length; index += 1) {
                context.lineTo(state.trail[index].x * cellSize, state.trail[index].y * cellSize);
            }
            context.stroke();
            context.restore();
        }

        function drawWalls(cellSize) {
            context.save();
            context.strokeStyle = theme.walls?.accentColor || "#173c33";
            context.lineWidth = Math.max(3, cellSize * 0.14);
            context.lineCap = "round";
            context.lineJoin = "round";
            context.beginPath();
            for (const wall of state.walls) {
                context.moveTo(wall.x1 * cellSize, wall.y1 * cellSize);
                context.lineTo(wall.x2 * cellSize, wall.y2 * cellSize);
            }
            context.stroke();

            context.strokeStyle = theme.walls?.color || "#245b3d";
            context.lineWidth = Math.max(2, cellSize * 0.08);
            context.stroke();
            context.restore();
        }

        function render() {
            if (!state.maze || state.cssSize <= 0) return;
            const cellSize = state.cssSize / state.maze.size;
            context.clearRect(0, 0, state.cssSize, state.cssSize);
            drawBackground();
            drawCellPattern(cellSize);
            drawTrail(cellSize);
            drawCharacter(state.assets.goal, theme.goal, cellCenter(state.maze.goal), cellSize, 0.62);
            drawCharacter(state.assets.player, theme.player, state.player, cellSize, 0.56);
            // Stěny jsou poslední vrstva, aby je stopa ani větší vlastní obrázek nikdy nezakryly.
            drawWalls(cellSize);
        }

        function pointFromPointer(event) {
            const rectangle = canvas.getBoundingClientRect();
            return {
                x: ((event.clientX - rectangle.left) / rectangle.width) * state.maze.size,
                y: ((event.clientY - rectangle.top) / rectangle.height) * state.maze.size
            };
        }

        function isAllowed(point) {
            return isPointAllowed(point, state.maze, state.walls, collisionClearance);
        }

        function appendTrailPoint(point) {
            const previous = state.trail[state.trail.length - 1];
            if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) >= 0.025) {
                state.trail.push({ ...point });
            }
        }

        function bumpWall() {
            clearTimeout(state.bumpTimer);
            frame.classList.remove("is-bumped");
            void frame.offsetWidth;
            frame.classList.add("is-bumped");
            state.bumpTimer = globalScope.setTimeout(() => frame.classList.remove("is-bumped"), 280);
            setMessage("Bum! Tudy vede stěna. Mrkev zůstala na posledním správném místě.", "error");
        }

        function checkGoal() {
            const goal = cellCenter(state.maze.goal);
            if (Math.hypot(state.player.x - goal.x, state.player.y - goal.y) > 0.3) return false;
            state.player = goal;
            appendTrailPoint(goal);
            state.complete = true;
            state.dragging = false;
            canvas.classList.remove("is-dragging");
            frame.classList.add("is-complete");
            setMessage("Výborně! Mrkev dorazila k zajíčkovi. To je ono!", "success");
            render();
            return true;
        }

        function movePlayerTo(target, announceCollision = true) {
            if (state.complete) return false;
            const result = sampleMovement(state.player, target, isAllowed);
            if (Math.hypot(result.lastValid.x - state.player.x, result.lastValid.y - state.player.y) > 0.001) {
                state.player = { ...result.lastValid };
                appendTrailPoint(state.player);
            }
            render();
            if (!result.valid && announceCollision) bumpWall();
            checkGoal();
            return result.valid;
        }

        function resetTrail() {
            state.complete = false;
            state.dragging = false;
            state.pointerId = null;
            state.player = cellCenter(state.maze.start);
            state.trail = [{ ...state.player }];
            frame.classList.remove("is-complete", "is-bumped");
            canvas.classList.remove("is-dragging");
            setMessage("Stopa je vymazaná. Chyť mrkev a zkus cestu znovu!");
            render();
            canvas.focus({ preventScroll: true });
        }

        function createNewMaze() {
            const difficulty = elements.difficulty.value;
            state.maze = generateMaze(difficulty);
            state.walls = buildWallSegments(state.maze);
            state.complete = false;
            state.player = cellCenter(state.maze.start);
            state.trail = [{ ...state.player }];
            state.dragging = false;
            state.pointerId = null;
            frame.classList.remove("is-complete", "is-bumped");
            canvas.classList.remove("is-dragging");
            const settings = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
            elements.mazeSize.textContent = `${settings.label} · ${state.maze.size} × ${state.maze.size}`;
            setMessage("Nové bludiště je připravené. Chyť mrkev!");
            resizeCanvas();
        }

        function startDragging(event) {
            if (state.complete || event.button !== 0) return;
            const point = pointFromPointer(event);
            if (Math.hypot(point.x - state.player.x, point.y - state.player.y) > 0.48) {
                setMessage("Začni přímo na mrkvi. Chyť ji a drž!");
                return;
            }
            state.dragging = true;
            state.pointerId = event.pointerId;
            canvas.classList.add("is-dragging");
            canvas.setPointerCapture?.(event.pointerId);
            setMessage("Skvěle, mrkev je připravená. Táhni ji chodbou k zajíčkovi!");
            event.preventDefault();
        }

        function continueDragging(event) {
            if (!state.dragging || event.pointerId !== state.pointerId) return;
            movePlayerTo(pointFromPointer(event));
            event.preventDefault();
        }

        function stopDragging(event) {
            if (!state.dragging || (event.pointerId !== undefined && event.pointerId !== state.pointerId)) return;
            state.dragging = false;
            canvas.classList.remove("is-dragging");
            if (event.pointerId !== undefined && canvas.hasPointerCapture?.(event.pointerId)) {
                canvas.releasePointerCapture(event.pointerId);
            }
            state.pointerId = null;
            if (!state.complete) setMessage("Mrkev čeká na posledním správném místě. Můžeš ji znovu chytit.");
        }

        canvas.addEventListener("pointerdown", startDragging);
        canvas.addEventListener("pointermove", continueDragging);
        canvas.addEventListener("pointerup", stopDragging);
        canvas.addEventListener("pointercancel", stopDragging);
        canvas.addEventListener("lostpointercapture", () => {
            if (!state.dragging) return;
            state.dragging = false;
            state.pointerId = null;
            canvas.classList.remove("is-dragging");
            if (!state.complete) setMessage("Mrkev zůstala v bezpečí. Chyť ji znovu a pokračuj.");
        });
        canvas.addEventListener("touchmove", (event) => {
            if (state.dragging) event.preventDefault();
        }, { passive: false });

        canvas.addEventListener("keydown", (event) => {
            if (state.complete) return;
            const movementByKey = {
                ArrowUp: { x: 0, y: -0.18 },
                ArrowDown: { x: 0, y: 0.18 },
                ArrowLeft: { x: -0.18, y: 0 },
                ArrowRight: { x: 0.18, y: 0 }
            };
            const movement = movementByKey[event.key];
            if (!movement) return;
            event.preventDefault();
            movePlayerTo({ x: state.player.x + movement.x, y: state.player.y + movement.y });
        });

        elements.newMaze.addEventListener("click", createNewMaze);
        elements.nextMaze.addEventListener("click", createNewMaze);
        elements.clearTrail.addEventListener("click", resetTrail);
        elements.difficulty.addEventListener("change", createNewMaze);

        if (typeof ResizeObserver !== "undefined") {
            new ResizeObserver(() => resizeCanvas()).observe(frame);
        } else {
            globalScope.addEventListener("resize", resizeCanvas);
        }

        loadThemeAssets();
        createNewMaze();
    });
}(typeof globalThis !== "undefined" ? globalThis : window));
