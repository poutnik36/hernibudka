import { Chess } from "./vendor/chess.js";

const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const center = ["d4", "e4", "d5", "e5"];

export function evaluate(game, perspective) {
  if (game.isCheckmate()) return game.turn() === perspective ? -100000 : 100000;
  if (game.isDraw()) return 0;
  let score = 0;
  for (const row of game.board()) for (const piece of row) if (piece) {
    let value = values[piece.type];
    if (piece.type === "p") value += piece.color === "w" ? (Number(piece.square[1]) - 2) * 7 : (7 - Number(piece.square[1])) * 7;
    if (center.includes(piece.square)) value += 18;
    score += piece.color === perspective ? value : -value;
  }
  const mobility = game.moves().length * (game.turn() === perspective ? 2 : -2);
  return score + mobility + (game.isCheck() ? (game.turn() === perspective ? -35 : 35) : 0);
}

function orderedMoves(game) {
  return game.moves({ verbose: true }).sort((a, b) => ((b.captured ? values[b.captured] : 0) + (b.promotion ? 800 : 0)) - ((a.captured ? values[a.captured] : 0) + (a.promotion ? 800 : 0)));
}

function alphaBeta(game, depth, alpha, beta, perspective, deadline, ply = 0) {
  if (Date.now() >= deadline) throw new Error("timeout");
  if (depth === 0 || game.isGameOver()) return evaluate(game, perspective) + (game.isCheckmate() ? (game.turn() === perspective ? ply : -ply) : 0);
  const maximizing = game.turn() === perspective;
  let best = maximizing ? -Infinity : Infinity;
  for (const move of orderedMoves(game)) {
    game.move(move);
    const score = alphaBeta(game, depth - 1, alpha, beta, perspective, deadline, ply + 1);
    game.undo();
    if (maximizing) { best = Math.max(best, score); alpha = Math.max(alpha, best); }
    else { best = Math.min(best, score); beta = Math.min(beta, best); }
    if (beta <= alpha) break;
  }
  return best;
}

function searchDepth(game, depth, deadline, random) {
  const perspective = game.turn();
  let bestScore = -Infinity, best = [];
  for (const move of orderedMoves(game)) {
    game.move(move);
    const score = alphaBeta(game, depth - 1, -Infinity, Infinity, perspective, deadline, 1);
    game.undo();
    if (score > bestScore) { bestScore = score; best = [move]; }
    else if (score === bestScore) best.push(move);
  }
  return best[Math.floor(random() * best.length)];
}

export function chooseMove(fen, difficulty = "medium", random = Math.random, now = Date.now) {
  const game = new Chess(fen);
  const moves = orderedMoves(game);
  if (!moves.length) return null;
  const mates = moves.filter((move) => { game.move(move); const mate = game.isCheckmate(); game.undo(); return mate; });
  if (mates.length) return mates[Math.floor(random() * mates.length)];
  if (difficulty === "easy") {
    const weighted = moves.flatMap((move) => Array(move.captured ? 3 : 1).fill(move));
    return weighted[Math.floor(random() * weighted.length)];
  }
  if (difficulty === "medium") return searchDepth(game, 2, now() + 2500, random);
  const deadline = now() + 1100;
  let completed = moves[0];
  for (let depth = 1; depth <= 5; depth++) {
    try { completed = searchDepth(game, depth, deadline, random) || completed; }
    catch (error) { if (error.message !== "timeout") throw error; break; }
  }
  return completed;
}
