(function (root) {
  const ROWS = 20;
  const COLS = 30;
  const cells = (items) => items.map(([row, col]) => ({ row, col }));
  const border = [];
  for (let col = 0; col < COLS; col++) border.push([0, col], [ROWS - 1, col]);
  for (let row = 1; row < ROWS - 1; row++)
    border.push([row, 0], [row, COLS - 1]);
  const cross = [];
  for (let col = 4; col < 26; col++)
    if (![10, 19].includes(col)) cross.push([10, col]);
  for (let row = 3; row < 18; row++)
    if (![7, 14].includes(row)) cross.push([row, 15]);
  const corridors = [];
  for (let row = 2; row < 18; row++) {
    if (row !== 6) corridors.push([row, 9]);
    if (row !== 14) corridors.push([row, 20]);
  }
  const islands = [
    [4, 6],
    [4, 7],
    [5, 6],
    [5, 7],
    [4, 22],
    [4, 23],
    [5, 22],
    [5, 23],
    [14, 6],
    [14, 7],
    [15, 6],
    [15, 7],
    [14, 22],
    [14, 23],
    [15, 22],
    [15, 23],
    [9, 13],
    [9, 14],
    [9, 15],
    [9, 16],
    [10, 13],
    [10, 16],
  ];
  const start = { head: { row: 10, col: 5 }, direction: "right", length: 4 };
  const levels = [
    {
      id: "level-1",
      title: "Volný prostor",
      rows: ROWS,
      cols: COLS,
      wrapEdges: true,
      obstacles: [],
      start,
    },
    {
      id: "level-2",
      title: "Ohraničená aréna",
      rows: ROWS,
      cols: COLS,
      wrapEdges: false,
      obstacles: cells(border),
      start,
    },
    {
      id: "level-3",
      title: "Středový kříž",
      rows: ROWS,
      cols: COLS,
      wrapEdges: false,
      obstacles: cells(cross),
      start: { ...start, head: { row: 5, col: 5 } },
    },
    {
      id: "level-4",
      title: "Dvojité chodby",
      rows: ROWS,
      cols: COLS,
      wrapEdges: false,
      obstacles: cells(corridors),
      start,
    },
    {
      id: "level-5",
      title: "Ostrovy",
      rows: ROWS,
      cols: COLS,
      wrapEdges: false,
      obstacles: cells(islands),
      start,
    },
  ];
  if (typeof module === "object" && module.exports) module.exports = levels;
  root.SNAKE_LEVELS = levels;
})(typeof window !== "undefined" ? window : globalThis);
