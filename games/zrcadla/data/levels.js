(function (root) {
    "use strict";

    const mirror = (id, row, col, solutionState, state, allowedStates = [0, 1, 2, 3]) => ({
        id, row, col, solutionState, state, allowedStates, locked: false
    });

    root.MIRROR_FALLBACK_LEVELS = {
        easy: {
            id: "fallback-easy", difficulty: "easy", rows: 5, cols: 5,
            source: { row: 4, col: 0, direction: "right" },
            target: { row: 1, col: 5, incomingDirection: "right" },
            mirrors: [mirror("m1", 4, 2, 0, 2), mirror("m2", 1, 2, 1, 3)]
        },
        medium: {
            id: "fallback-medium", difficulty: "medium", rows: 7, cols: 7,
            source: { row: 6, col: 0, direction: "right" },
            target: { row: 5, col: 7, incomingDirection: "right" },
            mirrors: [
                mirror("m1", 6, 2, 0, 2), mirror("m2", 1, 2, 1, 3),
                mirror("m3", 1, 4, 2, 0), mirror("m4", 5, 4, 3, 1),
                { ...mirror("f1", 3, 6, 1, 1, [1]), locked: true }
            ]
        },
        hard: {
            id: "fallback-hard", difficulty: "hard", rows: 9, cols: 9,
            source: { row: 8, col: 0, direction: "right" },
            target: { row: 2, col: 9, incomingDirection: "right" },
            mirrors: [
                mirror("m1", 8, 2, 0, 2), mirror("m2", 1, 2, 1, 3),
                mirror("m3", 1, 4, 2, 0), mirror("m4", 7, 4, 3, 1),
                mirror("m5", 7, 6, 0, 2), mirror("m6", 2, 6, 1, 3),
                { ...mirror("f1", 4, 8, 1, 1, [1]), locked: true },
                { ...mirror("f2", 6, 8, 0, 0, [0]), locked: true }
            ]
        }
    };
})(typeof window !== "undefined" ? window : globalThis);
