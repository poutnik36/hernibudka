import { Chess } from "./vendor/chess.js";

export { Chess };

export const colorName = (color) => color === "w" ? "bílý" : "černý";
export const pieceName = { k: "král", q: "dáma", r: "věž", b: "střelec", n: "jezdec", p: "pěšec" };

export function resultOf(game) {
  if (game.isCheckmate()) return { over: true, type: "checkmate", winner: game.turn() === "w" ? "b" : "w", text: `${game.turn() === "w" ? "Černý" : "Bílý"} vyhrál matem.` };
  if (game.isStalemate()) return { over: true, type: "stalemate", text: "Remíza patem." };
  if (game.isInsufficientMaterial()) return { over: true, type: "insufficient", text: "Remíza pro nedostatek materiálu." };
  if (game.isDrawByFiftyMoves()) return { over: true, type: "fifty", text: "Remíza pravidlem padesáti tahů." };
  if (game.isThreefoldRepetition()) return { over: true, type: "repetition", text: "Remíza trojím opakováním pozice." };
  if (game.isDraw()) return { over: true, type: "draw", text: "Partie skončila remízou." };
  return { over: false };
}

export function describeSquare(game, square) {
  const piece = game.get(square);
  return piece ? `${square}, ${piece.color === "w" ? "bílý" : "černý"} ${pieceName[piece.type]}` : `${square}, prázdné pole`;
}

export function legalMoves(game, square) {
  return game.moves({ square, verbose: true });
}

export function positionAfter(fen, move) {
  const game = new Chess(fen);
  const played = game.move(move);
  return { fen: game.fen(), move: played, result: resultOf(game) };
}
