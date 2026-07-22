(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.TicTacToeAI = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
    "use strict";

    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    function win(board, size, index, mark) {
        const row = Math.floor(index / size);
        const col = index % size;
        return directions.some(([dr, dc]) => {
            let count = 1;
            for (const sign of [-1, 1]) {
                for (let step = 1; ; step++) {
                    const r = row + dr * step * sign;
                    const c = col + dc * step * sign;
                    if (r < 0 || c < 0 || r >= size || c >= size || board[r * size + c] !== mark) break;
                    count++;
                }
            }
            return count >= 5;
        });
    }

    function candidates(board, size, range = 1) {
        if (board.every((cell) => !cell)) return [Math.floor(size / 2) * size + Math.floor(size / 2)];
        const result = new Set();
        board.forEach((mark, index) => {
            if (!mark) return;
            const row = Math.floor(index / size);
            const col = index % size;
            for (let r = Math.max(0, row - range); r <= Math.min(size - 1, row + range); r++) {
                for (let c = Math.max(0, col - range); c <= Math.min(size - 1, col + range); c++) {
                    if (!board[r * size + c]) result.add(r * size + c);
                }
            }
        });
        return [...result];
    }

    function immediate(board, size, mark, list) {
        return list.find((index) => {
            board[index] = mark;
            const result = win(board, size, index, mark);
            board[index] = null;
            return result;
        });
    }

    function scoreAt(board, size, index, mark) {
        let score = 0;
        board[index] = mark;
        for (const [dr, dc] of directions) {
            let count = 1;
            let open = 0;
            for (const sign of [-1, 1]) {
                for (let step = 1; ; step++) {
                    const r = Math.floor(index / size) + dr * step * sign;
                    const c = index % size + dc * step * sign;
                    if (r < 0 || c < 0 || r >= size || c >= size) break;
                    const value = board[r * size + c];
                    if (value === mark) count++;
                    else {
                        if (!value) open++;
                        break;
                    }
                }
            }
            score += count >= 5 ? 1e8 : count === 4 ? (open === 2 ? 400000 : 70000) : count === 3 ? open * 7000 : count === 2 ? open * 350 : open * 8;
        }
        board[index] = null;
        return score;
    }

    function ordered(board, size, mark, range, limit = 24) {
        const opponent = mark === "O" ? "X" : "O";
        return candidates(board, size, range)
            .map((index) => ({ index, score: scoreAt(board, size, index, mark) + scoreAt(board, size, index, opponent) * 1.15 }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((item) => item.index);
    }

    function medium(board, size, random = Math.random) {
        const list = candidates(board, size, 1);
        const winning = immediate(board, size, "O", list);
        if (winning !== undefined) return winning;
        const blocking = immediate(board, size, "X", list);
        if (blocking !== undefined) return blocking;
        return list.map((index) => ({ index, score: scoreAt(board, size, index, "O") + scoreAt(board, size, index, "X") * 1.05 + random() }))
            .sort((a, b) => b.score - a.score)[0]?.index;
    }

    function search(board, size, depth, maximizing, alpha, beta, deadline) {
        if (Date.now() >= deadline) throw new Error("timeout");
        if (depth === 0) return 0;
        const mark = maximizing ? "O" : "X";
        const moves = ordered(board, size, mark, 2, depth > 1 ? 14 : 22);
        let best = maximizing ? -Infinity : Infinity;
        for (const index of moves) {
            board[index] = mark;
            const value = win(board, size, index, mark)
                ? (maximizing ? 1 : -1) * (1e9 + depth)
                : search(board, size, depth - 1, !maximizing, alpha, beta, deadline);
            board[index] = null;
            const positional = scoreAt(board, size, index, "O") - scoreAt(board, size, index, "X") * 1.12;
            const total = value + positional;
            best = maximizing ? Math.max(best, total) : Math.min(best, total);
            if (maximizing) alpha = Math.max(alpha, best); else beta = Math.min(beta, best);
            if (beta <= alpha) break;
        }
        return Number.isFinite(best) ? best : 0;
    }

    function hard(board, size, random = Math.random, deadline = Date.now() + 700) {
        const list = candidates(board, size, 2);
        const winning = immediate(board, size, "O", list);
        if (winning !== undefined) return winning;
        const blocking = immediate(board, size, "X", list);
        if (blocking !== undefined) return blocking;
        let completedBest = medium(board, size, random);
        for (let depth = 1; depth <= 3; depth++) {
            let bestScore = -Infinity;
            let bestMoves = [];
            try {
                for (const index of ordered(board, size, "O", 2)) {
                    board[index] = "O";
                    const score = search(board, size, depth - 1, false, -Infinity, Infinity, deadline);
                    board[index] = null;
                    if (score > bestScore) { bestScore = score; bestMoves = [index]; }
                    else if (score === bestScore) bestMoves.push(index);
                }
                if (bestMoves.length) completedBest = bestMoves[Math.floor(random() * bestMoves.length)];
            } catch (error) {
                if (error.message !== "timeout") throw error;
                break;
            }
        }
        return completedBest;
    }

    function choose(board, size, difficulty, random = Math.random) {
        const free = board.map((value, index) => value ? null : index).filter((index) => index !== null);
        if (!free.length) return undefined;
        if (difficulty === "easy") {
            const nearby = candidates(board, size, 1);
            const pool = nearby.length ? nearby : free;
            return pool[Math.floor(random() * pool.length)];
        }
        return difficulty === "hard" ? hard(board, size, random) : medium(board, size, random);
    }

    return { win, candidates, scoreAt, choose, medium, hard };
});
