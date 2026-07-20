(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.CrosswordCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
    "use strict";

    const normalizeCzech = (value) => String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleUpperCase("cs-CZ")
        .replace(/[^A-Z]/g, "");

    const letters = (value) => Array.from(String(value || "").toLocaleUpperCase("cs-CZ"));
    const answersMatch = (entered, expected) => normalizeCzech(entered) === normalizeCzech(expected);

    function buildPuzzle(puzzle, words) {
        const rows = puzzle.placements.map((placement, index) => {
            const entry = words[placement.wordId];
            if (!entry) throw new Error(`Chybí slovo ${placement.wordId}.`);
            const answerLetters = letters(entry.answer);
            if (placement.secretIndex < 0 || placement.secretIndex >= answerLetters.length) throw new Error(`Neplatný index tajenky u ${placement.wordId}.`);
            return { ...placement, number: index + 1, entry, letters: answerLetters };
        });
        const extracted = rows.map((row) => row.letters[row.secretIndex]).join("");
        if (extracted !== puzzle.secret) throw new Error(`Tajenka ${puzzle.id} nesouhlasí: ${extracted}.`);
        return { ...puzzle, rows };
    }

    function validatePuzzles(puzzles, words, themes) {
        const ids = new Set();
        const counts = {};
        puzzles.forEach((puzzle) => {
            if (ids.has(puzzle.id)) throw new Error(`Duplicitní křížovka ${puzzle.id}.`);
            if (!themes[puzzle.category]) throw new Error(`Neznámá kategorie ${puzzle.category}.`);
            ids.add(puzzle.id);
            counts[puzzle.category] = (counts[puzzle.category] || 0) + 1;
            buildPuzzle(puzzle, words);
        });
        return counts;
    }

    return { normalizeCzech, letters, answersMatch, buildPuzzle, validatePuzzles };
});

(function (root) {
    "use strict";
    if (typeof document === "undefined") return;

    const { CROSSWORD_THEMES: themes, CROSSWORD_WORDS: words, CROSSWORD_PUZZLES: puzzles, CrosswordCore: core } = root;
    if (!themes || !words || !puzzles) return;

    const elements = {
        categories: document.querySelector("#category-list"),
        grid: document.querySelector("#crossword-grid"),
        clues: document.querySelector("#clue-list"),
        heading: document.querySelector("#puzzle-heading"),
        category: document.querySelector("#puzzle-category"),
        secretPrompt: document.querySelector("#secret-prompt"),
        secret: document.querySelector("#secret-answer"),
        message: document.querySelector("#game-message"),
        newPuzzle: document.querySelector("#new-puzzle"),
        checkWord: document.querySelector("#check-word"),
        checkPuzzle: document.querySelector("#check-puzzle"),
        clear: document.querySelector("#clear-puzzle"),
        hint: document.querySelector("#secret-hint")
    };

    let current;
    let activeRow = 0;
    let revealedSecretLetters = 0;
    let completed = false;
    const inputRows = [];
    const clueButtons = [];

    try {
        core.validatePuzzles(puzzles, words, themes);
    } catch (error) {
        elements.message.textContent = "Křížovku se nepodařilo připravit. Zkus stránku načíst znovu.";
        elements.message.className = "game-message game-message--error";
        return;
    }

    function setMessage(text, type = "") {
        elements.message.textContent = text;
        elements.message.className = `game-message${type ? ` game-message--${type}` : ""}`;
    }

    function renderCategories() {
        elements.categories.replaceChildren();
        Object.entries(themes).forEach(([id, theme]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "category-button";
            button.dataset.category = id;
            button.setAttribute("aria-pressed", String(current?.category === id));
            button.textContent = `${theme.icon} ${theme.name}`;
            button.addEventListener("click", () => choosePuzzle(id));
            elements.categories.append(button);
        });
    }

    function choosePuzzle(category, avoidId = current?.id) {
        const choices = puzzles.filter((puzzle) => puzzle.category === category && puzzle.id !== avoidId);
        const pool = choices.length ? choices : puzzles.filter((puzzle) => puzzle.category === category);
        const puzzle = pool[Math.floor(Math.random() * pool.length)];
        loadPuzzle(puzzle);
    }

    function createClueVisual(entry) {
        const visual = document.createElement("span");
        visual.className = "clue-visual";
        visual.setAttribute("aria-hidden", "true");
        visual.textContent = entry.emoji || "❓";
        if (entry.image) {
            const image = document.createElement("img");
            image.alt = "";
            image.src = entry.image;
            image.addEventListener("load", () => visual.replaceChildren(image), { once: true });
            image.addEventListener("error", () => image.remove(), { once: true });
        }
        return visual;
    }

    function makeInput(rowIndex, letterIndex, expected) {
        const input = document.createElement("input");
        input.type = "text";
        input.inputMode = "text";
        input.autocomplete = "off";
        input.spellcheck = false;
        input.maxLength = 2;
        input.className = "letter-input";
        input.dataset.row = rowIndex;
        input.dataset.letter = letterIndex;
        input.dataset.expected = expected;
        input.setAttribute("aria-label", `Slovo ${rowIndex + 1}, písmeno ${letterIndex + 1}`);
        input.addEventListener("focus", () => setActiveRow(rowIndex));
        input.addEventListener("input", () => {
            const entered = core.letters(input.value).filter((character) => /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(character));
            input.value = entered.at(-1) || "";
            clearInputState(input);
            if (input.value) focusRelative(rowIndex, letterIndex, 1);
        });
        input.addEventListener("keydown", (event) => handleKey(event, rowIndex, letterIndex));
        return input;
    }

    function handleKey(event, rowIndex, letterIndex) {
        const input = inputRows[rowIndex][letterIndex];
        if (event.key === "Backspace") {
            if (input.value) {
                input.value = "";
                clearInputState(input);
            } else {
                focusRelative(rowIndex, letterIndex, -1, true);
            }
            event.preventDefault();
        } else if (event.key === "ArrowLeft") {
            focusRelative(rowIndex, letterIndex, -1);
            event.preventDefault();
        } else if (event.key === "ArrowRight") {
            focusRelative(rowIndex, letterIndex, 1);
            event.preventDefault();
        } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            const nextRow = Math.max(0, Math.min(inputRows.length - 1, rowIndex + (event.key === "ArrowUp" ? -1 : 1)));
            inputRows[nextRow][Math.min(letterIndex, inputRows[nextRow].length - 1)].focus();
            event.preventDefault();
        } else if (event.key === "Enter") {
            checkRow(rowIndex);
            event.preventDefault();
        }
    }

    function focusRelative(rowIndex, letterIndex, direction, erase = false) {
        const target = inputRows[rowIndex][letterIndex + direction];
        if (!target) return;
        if (erase) {
            target.value = "";
            clearInputState(target);
        }
        target.focus();
    }

    function clearInputState(input) {
        input.removeAttribute("aria-invalid");
        input.classList.remove("is-correct");
    }

    function setActiveRow(rowIndex) {
        activeRow = rowIndex;
        inputRows.flat().forEach((input) => input.parentElement.classList.toggle("crossword-cell--active", Number(input.dataset.row) === rowIndex));
        clueButtons.forEach((button, index) => button.setAttribute("aria-current", String(index === rowIndex)));
    }

    function getRowValue(rowIndex) {
        return inputRows[rowIndex].map((input) => input.value).join("");
    }

    function markRow(rowIndex, showErrors) {
        const row = current.rows[rowIndex];
        const correct = core.answersMatch(getRowValue(rowIndex), row.entry.answer);
        inputRows[rowIndex].forEach((input, index) => {
            const letterCorrect = core.answersMatch(input.value, row.letters[index]);
            input.classList.toggle("is-correct", correct || letterCorrect);
            if (showErrors && input.value && !letterCorrect) input.setAttribute("aria-invalid", "true");
            else input.removeAttribute("aria-invalid");
            if (correct) input.value = row.letters[index];
        });
        const result = clueButtons[rowIndex].querySelector(".clue-result");
        result.textContent = correct ? "✓" : showErrors ? "✕" : "";
        result.classList.toggle("clue-result--wrong", showErrors && !correct);
        result.setAttribute("aria-label", correct ? "Správně" : showErrors ? "Slovo zatím není správně" : "");
        return correct;
    }

    function checkRow(rowIndex) {
        if (markRow(rowIndex, true)) {
            setMessage("Výborně, celé slovo je správně! ✓", "success");
            checkCompletion(false);
        } else {
            setMessage("Tady ještě něco nesedí. Červený křížek označuje slovo k opravě.", "error");
        }
    }

    function checkCompletion(announceFailure = true) {
        const results = current.rows.map((_, index) => markRow(index, announceFailure));
        if (results.every(Boolean)) {
            completed = true;
            current.rows.forEach((_, index) => markRow(index, false));
            renderSecret();
            elements.hint.disabled = true;
            setMessage(`Hurá! Tajenka je ${current.secret}. Jsi křížovkářský mistr! 🎉`, "success");
            return true;
        }
        if (announceFailure) setMessage(`Správně máš ${results.filter(Boolean).length} z ${results.length} slov. Zkus opravit slova s křížkem.`, "error");
        return false;
    }

    function renderSecret() {
        elements.secret.replaceChildren();
        core.letters(current.secret).forEach((letter, index) => {
            const span = document.createElement("span");
            span.className = "secret-letter";
            span.textContent = completed || index < revealedSecretLetters ? letter : "?";
            elements.secret.append(span);
        });
        elements.secret.setAttribute("aria-label", completed ? `Tajenka ${current.secret}` : `Tajenka má ${core.letters(current.secret).length} písmen`);
    }

    function renderPuzzle() {
        inputRows.length = 0;
        clueButtons.length = 0;
        elements.grid.replaceChildren();
        elements.clues.replaceChildren();
        elements.heading.textContent = current.title;
        elements.category.textContent = `${themes[current.category].icon} ${themes[current.category].name}`;
        elements.secretPrompt.textContent = current.prompt;

        current.rows.forEach((row, rowIndex) => {
            inputRows[rowIndex] = [];
            for (let col = 0; col < 12; col += 1) {
                const cell = document.createElement("div");
                cell.className = "crossword-cell crossword-cell--blocked";
                const letterIndex = col - row.col;
                if (letterIndex >= 0 && letterIndex < row.letters.length) {
                    cell.className = `crossword-cell${col === current.secretColumn ? " crossword-cell--secret" : ""}`;
                    if (letterIndex === 0) {
                        const number = document.createElement("span");
                        number.className = "cell-number";
                        number.textContent = row.number;
                        cell.append(number);
                    }
                    const input = makeInput(rowIndex, letterIndex, row.letters[letterIndex]);
                    inputRows[rowIndex].push(input);
                    cell.append(input);
                }
                elements.grid.append(cell);
            }

            const item = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "clue-button";
            button.append(createClueVisual(row.entry));
            const clue = document.createElement("span");
            clue.className = "clue-text";
            clue.textContent = `${row.number}. ${row.entry.clue} (${row.letters.length})`;
            button.append(clue);
            const result = document.createElement("span");
            result.className = "clue-result";
            button.append(result);
            button.addEventListener("click", () => inputRows[rowIndex][0].focus());
            item.append(button);
            elements.clues.append(item);
            clueButtons.push(button);
        });
        renderSecret();
        setActiveRow(0);
        setMessage("Vyber si nápovědu a začni luštit.");
    }

    function loadPuzzle(puzzle) {
        current = core.buildPuzzle(puzzle, words);
        revealedSecretLetters = 0;
        completed = false;
        elements.hint.disabled = false;
        renderCategories();
        renderPuzzle();
    }

    elements.newPuzzle.addEventListener("click", () => choosePuzzle(current.category));
    elements.checkWord.addEventListener("click", () => checkRow(activeRow));
    elements.checkPuzzle.addEventListener("click", () => checkCompletion(true));
    elements.clear.addEventListener("click", () => {
        inputRows.flat().forEach((input) => { input.value = ""; clearInputState(input); });
        clueButtons.forEach((button) => {
            const result = button.querySelector(".clue-result");
            result.textContent = "";
            result.className = "clue-result";
        });
        completed = false;
        revealedSecretLetters = 0;
        elements.hint.disabled = false;
        renderSecret();
        setMessage("Křížovka je prázdná. Můžeš začít znovu.");
        inputRows[0][0].focus();
    });
    elements.hint.addEventListener("click", () => {
        if (revealedSecretLetters < core.letters(current.secret).length) revealedSecretLetters += 1;
        renderSecret();
        if (revealedSecretLetters >= core.letters(current.secret).length) elements.hint.disabled = true;
        setMessage("Jedno písmeno tajenky je odkryté. Zkus doplnit zbytek!");
    });

    loadPuzzle(puzzles[0]);
})(typeof window !== "undefined" ? window : globalThis);
