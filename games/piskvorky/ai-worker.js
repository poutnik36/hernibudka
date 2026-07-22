importScripts("ai.js");
self.onmessage = (event) => {
  const { board, size, difficulty, gameToken } = event.data;
  const index = self.TicTacToeAI.choose(board.slice(), size, difficulty);
  self.postMessage({ index, gameToken });
};
