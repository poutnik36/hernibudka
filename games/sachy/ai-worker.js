import { chooseMove } from "./ai.js";

self.onmessage = (event) => {
  const { fen, difficulty, gameToken, ply } = event.data;
  const move = chooseMove(fen, difficulty);
  self.postMessage({ move: move ? { from: move.from, to: move.to, promotion: move.promotion } : null, gameToken, ply });
};
