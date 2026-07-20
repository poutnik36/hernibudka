"use strict";

(function initializeRobotGame(globalScope) {
    const DIRECTIONS = Object.freeze({
        up: Object.freeze({ row: -1, col: 0, symbol: "↑", label: "nahoru" }),
        down: Object.freeze({ row: 1, col: 0, symbol: "↓", label: "dolů" }),
        left: Object.freeze({ row: 0, col: -1, symbol: "←", label: "vlevo" }),
        right: Object.freeze({ row: 0, col: 1, symbol: "→", label: "vpravo" })
    });

    const DIFFICULTIES = Object.freeze({
        easy: Object.freeze({ gridSize: 5, minSteps: 4, maxSteps: 6, label: "Lehká" }),
        medium: Object.freeze({ gridSize: 6, minSteps: 7, maxSteps: 10, label: "Střední" }),
        hard: Object.freeze({ gridSize: 7, minSteps: 11, maxSteps: 15, label: "Těžká" })
    });

    const MAX_GENERATION_ATTEMPTS = 250;

    function positionKey(position) {
        return `${position.row}:${position.col}`;
    }

    function positionsEqual(first, second) {
        return first.row === second.row && first.col === second.col;
    }

    function isInsideGrid(position, gridSize) {
        return position.row >= 0
            && position.row < gridSize
            && position.col >= 0
            && position.col < gridSize;
    }

    function movePosition(position, direction) {
        const movement = DIRECTIONS[direction];
        if (!movement) {
            throw new TypeError(`Neznámý směr: ${direction}`);
        }

        return {
            row: position.row + movement.row,
            col: position.col + movement.col
        };
    }

    function shuffle(items, random = Math.random) {
        const result = [...items];
        for (let index = result.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(random() * (index + 1));
            [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
        }
        return result;
    }

    function validatePath(model) {
        if (!model || !Number.isInteger(model.gridSize) || model.gridSize < 2) {
            return false;
        }

        if (!Array.isArray(model.path)
            || !Array.isArray(model.solution)
            || model.path.length !== model.solution.length + 1
            || model.path.length < 2) {
            return false;
        }

        if (!positionsEqual(model.start, model.path[0])
            || !positionsEqual(model.goal, model.path[model.path.length - 1])) {
            return false;
        }

        const visited = new Set();
        for (let index = 0; index < model.path.length; index += 1) {
            const position = model.path[index];
            if (!isInsideGrid(position, model.gridSize) || visited.has(positionKey(position))) {
                return false;
            }
            visited.add(positionKey(position));

            if (index < model.solution.length) {
                const expectedNext = movePosition(position, model.solution[index]);
                if (!positionsEqual(expectedNext, model.path[index + 1])) {
                    return false;
                }
            }
        }

        return true;
    }

    function buildFallbackPath(settings) {
        const cells = [];
        for (let row = 0; row < settings.gridSize; row += 1) {
            if (row % 2 === 0) {
                for (let col = 0; col < settings.gridSize; col += 1) cells.push({ row, col });
            } else {
                for (let col = settings.gridSize - 1; col >= 0; col -= 1) cells.push({ row, col });
            }
        }

        const targetSteps = Math.floor((settings.minSteps + settings.maxSteps) / 2);
        const path = cells.slice(0, targetSteps + 1);
        const solution = [];
        for (let index = 0; index < path.length - 1; index += 1) {
            const rowDifference = path[index + 1].row - path[index].row;
            const colDifference = path[index + 1].col - path[index].col;
            if (rowDifference === 1) solution.push("down");
            else if (rowDifference === -1) solution.push("up");
            else if (colDifference === 1) solution.push("right");
            else solution.push("left");
        }

        return {
            gridSize: settings.gridSize,
            start: { ...path[0] },
            goal: { ...path[path.length - 1] },
            path,
            solution,
            usedFallback: true
        };
    }

    function generatePath(difficulty = "easy", random = Math.random) {
        const settings = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
        const directionNames = Object.keys(DIRECTIONS);

        for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
            const targetSteps = settings.minSteps
                + Math.floor(random() * (settings.maxSteps - settings.minSteps + 1));
            const start = {
                row: Math.floor(random() * settings.gridSize),
                col: Math.floor(random() * settings.gridSize)
            };
            const path = [{ ...start }];
            const solution = [];
            const visited = new Set([positionKey(start)]);

            while (solution.length < targetSteps) {
                const current = path[path.length - 1];
                const availableDirections = shuffle(directionNames, random).filter((direction) => {
                    const next = movePosition(current, direction);
                    return isInsideGrid(next, settings.gridSize) && !visited.has(positionKey(next));
                });

                if (availableDirections.length === 0) break;
                const direction = availableDirections[0];
                const next = movePosition(current, direction);
                solution.push(direction);
                path.push(next);
                visited.add(positionKey(next));
            }

            const model = {
                gridSize: settings.gridSize,
                start: { ...path[0] },
                goal: { ...path[path.length - 1] },
                path,
                solution,
                usedFallback: false
            };

            if (solution.length === targetSteps && validatePath(model)) {
                return model;
            }
        }

        return buildFallbackPath(settings);
    }

    function simulateProgram(model, program) {
        if (!validatePath(model)) throw new TypeError("Simulátor dostal neplatnou cestu.");

        let position = { ...model.start };
        let pathIndex = 0;

        for (let commandIndex = 0; commandIndex < program.length; commandIndex += 1) {
            const direction = program[commandIndex];
            if (!DIRECTIONS[direction]) {
                return { status: "invalid-command", commandIndex, position, pathIndex };
            }

            if (pathIndex >= model.path.length - 1) {
                return { status: "too-long", commandIndex, position, pathIndex };
            }

            const next = movePosition(position, direction);
            if (!isInsideGrid(next, model.gridSize)) {
                return { status: "outside", commandIndex, position, attemptedPosition: next, pathIndex };
            }

            if (!positionsEqual(next, model.path[pathIndex + 1])) {
                return { status: "off-path", commandIndex, position: next, pathIndex };
            }

            position = next;
            pathIndex += 1;
        }

        if (positionsEqual(position, model.goal)) {
            return { status: "success", commandIndex: program.length - 1, position, pathIndex };
        }

        return { status: "too-short", commandIndex: program.length, position, pathIndex };
    }

    const coreApi = Object.freeze({
        DIRECTIONS,
        DIFFICULTIES,
        MAX_GENERATION_ATTEMPTS,
        generatePath,
        validatePath,
        simulateProgram,
        movePosition,
        isInsideGrid,
        positionsEqual
    });

    globalScope.RobotGameCore = coreApi;
    if (typeof module !== "undefined" && module.exports) module.exports = coreApi;
    if (typeof document === "undefined") return;

    document.addEventListener("DOMContentLoaded", () => {
        const theme = globalScope.ROBOT_THEME || {};
        const elements = {
            board: document.querySelector("#robot-board"),
            difficulty: document.querySelector("#difficulty"),
            newPath: document.querySelector("#new-path"),
            routeInfo: document.querySelector("#route-info"),
            programList: document.querySelector("#program-list"),
            emptyProgram: document.querySelector("#empty-program"),
            commandCount: document.querySelector("#command-count"),
            removeCommand: document.querySelector("#remove-command"),
            clearProgram: document.querySelector("#clear-program"),
            runRobot: document.querySelector("#run-robot"),
            message: document.querySelector("#game-message"),
            directionButtons: [...document.querySelectorAll("[data-direction]")],
            lockableControls: [...document.querySelectorAll("[data-lockable]")]
        };

        if (Object.values(elements).some((element) => element === null)) return;

        const state = {
            model: null,
            program: [],
            running: false,
            robotPosition: null,
            robotMarker: null
        };

        function createThemeVisual(name, className = "") {
            const config = theme[name] || { image: "", fallback: "?", alt: name };
            const wrapper = document.createElement("span");
            wrapper.className = `theme-visual ${className}`.trim();
            wrapper.setAttribute("role", "img");
            wrapper.setAttribute("aria-label", config.alt || name);

            const image = document.createElement("img");
            image.className = "theme-visual__image";
            image.alt = "";
            image.hidden = true;

            const fallback = document.createElement("span");
            fallback.className = "theme-visual__fallback";
            fallback.textContent = config.fallback || "?";
            fallback.setAttribute("aria-hidden", "true");

            image.addEventListener("load", () => {
                image.hidden = false;
                fallback.hidden = true;
            }, { once: true });
            image.addEventListener("error", () => {
                image.hidden = true;
                fallback.hidden = false;
            }, { once: true });

            if (config.image) {
                globalScope.fetch(config.image, { method: "HEAD", cache: "force-cache" })
                    .then((response) => {
                        if (response.ok) image.src = config.image;
                    })
                    .catch(() => {
                        image.hidden = true;
                        fallback.hidden = false;
                    });
            }

            wrapper.append(image, fallback);
            return wrapper;
        }

        function getCell(position) {
            return elements.board.querySelector(`[data-row="${position.row}"][data-col="${position.col}"]`);
        }

        function describeCell(position, pathKeys) {
            const labels = [`Řádek ${position.row + 1}, sloupec ${position.col + 1}`];
            if (positionsEqual(position, state.model.start)) labels.push("start");
            if (positionsEqual(position, state.model.goal)) labels.push("cíl");
            if (pathKeys.has(positionKey(position))) labels.push("pole trasy");
            return labels.join(", ");
        }

        function renderBoard() {
            elements.board.replaceChildren();
            elements.board.style.setProperty("--grid-size", String(state.model.gridSize));
            elements.board.setAttribute("aria-rowcount", String(state.model.gridSize));
            elements.board.setAttribute("aria-colcount", String(state.model.gridSize));
            const pathKeys = new Set(state.model.path.map(positionKey));

            for (let row = 0; row < state.model.gridSize; row += 1) {
                for (let col = 0; col < state.model.gridSize; col += 1) {
                    const position = { row, col };
                    const cell = document.createElement("div");
                    cell.className = "board-cell";
                    if (pathKeys.has(positionKey(position))) cell.classList.add("board-cell--path");
                    cell.dataset.row = String(row);
                    cell.dataset.col = String(col);
                    cell.setAttribute("role", "gridcell");
                    cell.setAttribute("aria-rowindex", String(row + 1));
                    cell.setAttribute("aria-colindex", String(col + 1));
                    cell.setAttribute("aria-label", describeCell(position, pathKeys));

                    if (positionsEqual(position, state.model.start)) {
                        const marker = document.createElement("span");
                        marker.className = "cell-marker";
                        marker.append(createThemeVisual("start"));
                        cell.append(marker);
                    }
                    if (positionsEqual(position, state.model.goal)) {
                        const marker = document.createElement("span");
                        marker.className = "cell-marker";
                        marker.append(createThemeVisual("goal"));
                        cell.append(marker);
                    }
                    elements.board.append(cell);
                }
            }

            state.robotMarker = createThemeVisual("robot", "robot-marker");
            resetRobotVisual();
        }

        function resetRobotVisual() {
            elements.board.querySelectorAll(".board-cell--visited, .board-cell--current, .board-cell--error")
                .forEach((cell) => cell.classList.remove("board-cell--visited", "board-cell--current", "board-cell--error"));
            state.robotPosition = { ...state.model.start };
            const startCell = getCell(state.robotPosition);
            startCell.classList.add("board-cell--current");
            startCell.append(state.robotMarker);
            clearExecutionHighlights();
        }

        function moveRobotVisual(position, markError = false) {
            const previousCell = getCell(state.robotPosition);
            previousCell?.classList.remove("board-cell--current");
            previousCell?.classList.add("board-cell--visited");
            const nextCell = getCell(position);
            if (!nextCell) {
                previousCell?.classList.add("board-cell--error");
                return;
            }
            state.robotPosition = { ...position };
            nextCell.append(state.robotMarker);
            nextCell.classList.add("board-cell--current");
            if (markError) nextCell.classList.add("board-cell--error");
        }

        function setMessage(text, type = "info") {
            elements.message.textContent = text;
            elements.message.classList.toggle("game-message--success", type === "success");
            elements.message.classList.toggle("game-message--error", type === "error");
        }

        function commandLabel(direction) {
            return DIRECTIONS[direction]?.label || direction;
        }

        function formatCommandCount(count) {
            if (count === 1) return "1 příkaz";
            if (count >= 2 && count <= 4) return `${count} příkazy`;
            return `${count} příkazů`;
        }

        function renderProgram() {
            elements.programList.replaceChildren();
            state.program.forEach((direction, index) => {
                const command = document.createElement("li");
                command.className = "program-command";
                command.dataset.step = String(index + 1);
                command.dataset.commandIndex = String(index);
                command.textContent = DIRECTIONS[direction].symbol;
                command.setAttribute("aria-label", `${index + 1}. příkaz: ${commandLabel(direction)}`);
                elements.programList.append(command);
            });
            elements.emptyProgram.hidden = state.program.length > 0;
            elements.commandCount.textContent = formatCommandCount(state.program.length);
            updateControlAvailability();
        }

        function clearExecutionHighlights() {
            elements.programList.querySelectorAll(".program-command--active, .program-command--error")
                .forEach((command) => command.classList.remove("program-command--active", "program-command--error"));
        }

        function highlightCommand(index, error = false) {
            clearExecutionHighlights();
            const command = elements.programList.querySelector(`[data-command-index="${index}"]`);
            command?.classList.add(error ? "program-command--error" : "program-command--active");
            const reducedMotion = globalScope.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
            command?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
        }

        function updateControlAvailability() {
            if (state.running) return;
            elements.removeCommand.disabled = state.program.length === 0;
            elements.clearProgram.disabled = state.program.length === 0;
            elements.runRobot.disabled = state.program.length === 0;
        }

        function lockControls(locked) {
            state.running = locked;
            elements.lockableControls.forEach((control) => { control.disabled = locked; });
            if (!locked) updateControlAvailability();
        }

        function prepareForProgramEdit() {
            if (state.running) return false;
            resetRobotVisual();
            setMessage("Program můžeš upravit a zkusit znovu.");
            return true;
        }

        function addCommand(direction) {
            if (!DIRECTIONS[direction] || !prepareForProgramEdit()) return;
            state.program.push(direction);
            renderProgram();
            setMessage(`Přidán příkaz ${commandLabel(direction)}.`);
        }

        function removeLastCommand() {
            if (state.program.length === 0 || !prepareForProgramEdit()) return;
            state.program.pop();
            renderProgram();
            setMessage("Poslední příkaz je odebraný.");
        }

        function clearProgram() {
            if (state.program.length === 0 || !prepareForProgramEdit()) return;
            state.program = [];
            renderProgram();
            setMessage("Program je vymazaný. Můžeš začít znovu.");
        }

        function createNewPath() {
            if (state.running) return;
            state.model = generatePath(elements.difficulty.value);
            state.program = [];
            renderBoard();
            renderProgram();
            const settings = DIFFICULTIES[elements.difficulty.value] || DIFFICULTIES.easy;
            elements.routeInfo.textContent = `${settings.label} · ${state.model.solution.length} kroků`;
            setMessage("Cesta je připravená. Teď sestav program!");
        }

        function waitForStep() {
            const reducedMotion = globalScope.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
            return new Promise((resolve) => globalScope.setTimeout(resolve, reducedMotion ? 40 : 520));
        }

        async function runRobot() {
            if (state.running || state.program.length === 0) {
                if (state.program.length === 0) setMessage("Nejdřív přidej alespoň jednu šipku.", "error");
                return;
            }

            lockControls(true);
            resetRobotVisual();
            setMessage("Robot vyráží. Sleduj jednotlivé kroky!");
            let position = { ...state.model.start };
            let pathIndex = 0;

            for (let commandIndex = 0; commandIndex < state.program.length; commandIndex += 1) {
                const direction = state.program[commandIndex];
                highlightCommand(commandIndex);
                await waitForStep();

                if (pathIndex >= state.model.path.length - 1) {
                    highlightCommand(commandIndex, true);
                    setMessage("Robot už byl v cíli, ale v programu zůstala další šipka. Zkus ji odebrat.", "error");
                    lockControls(false);
                    return;
                }

                const next = movePosition(position, direction);
                if (!isInsideGrid(next, state.model.gridSize)) {
                    moveRobotVisual(position, true);
                    highlightCommand(commandIndex, true);
                    setMessage("Jejda, robot by tímto krokem vyjel z mapy. Uprav označenou šipku.", "error");
                    lockControls(false);
                    return;
                }

                if (!positionsEqual(next, state.model.path[pathIndex + 1])) {
                    moveRobotVisual(next, true);
                    highlightCommand(commandIndex, true);
                    setMessage("Tudy cesta nevede. Podívej se na označenou šipku a zkus jiný směr.", "error");
                    lockControls(false);
                    return;
                }

                position = next;
                pathIndex += 1;
                moveRobotVisual(position);
            }

            await waitForStep();
            clearExecutionHighlights();
            if (positionsEqual(position, state.model.goal)) {
                setMessage("Výborně! Robot dorazil až do cíle. Zvládl jsi to!", "success");
            } else {
                setMessage("Robot se zastavil před cílem. Program potřebuje ještě pár šipek.", "error");
            }
            lockControls(false);
        }

        elements.directionButtons.forEach((button) => {
            button.addEventListener("pointerdown", () => button.classList.add("direction-button--pressed"));
            button.addEventListener("pointerup", () => button.classList.remove("direction-button--pressed"));
            button.addEventListener("pointercancel", () => button.classList.remove("direction-button--pressed"));
            button.addEventListener("click", () => addCommand(button.dataset.direction));
        });
        elements.removeCommand.addEventListener("click", removeLastCommand);
        elements.clearProgram.addEventListener("click", clearProgram);
        elements.runRobot.addEventListener("click", runRobot);
        elements.newPath.addEventListener("click", createNewPath);
        elements.difficulty.addEventListener("change", createNewPath);

        document.addEventListener("keydown", (event) => {
            if (state.running || event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.target.closest("input, select, textarea, button, a, summary")) return;
            const directionByKey = {
                ArrowUp: "up",
                ArrowDown: "down",
                ArrowLeft: "left",
                ArrowRight: "right"
            };

            if (directionByKey[event.key]) {
                event.preventDefault();
                addCommand(directionByKey[event.key]);
            } else if (event.key === "Backspace") {
                event.preventDefault();
                removeLastCommand();
            } else if (event.key === "Delete") {
                event.preventDefault();
                clearProgram();
            } else if (event.key === "Enter") {
                event.preventDefault();
                runRobot();
            }
        });

        createNewPath();
    });
}(typeof globalThis !== "undefined" ? globalThis : window));
