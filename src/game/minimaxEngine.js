import { EMPTY, HUMAN, ROBOT, getDirectedBoard, getLegalMoves, getUltimateWinner } from './gameRules.js';
import { evaluatePosition, getMovePreference } from './evaluation.js';

// Veća dubina daje jačeg robota, ali Ultimate XOX vrlo brzo pravi mnogo grana.
const SEARCH_DEPTH = 4;

function simulateMove(cells, move, mark) {
    const nextCells = [...cells];
    nextCells[move] = mark;
    return nextCells;
}

function orderMoves(moves) {
    return [...moves].sort((left, right) => getMovePreference(right) - getMovePreference(left));
}

function minimax(cells, activeBoard, depth, alpha, beta, isRobotTurn) {
    const winner = getUltimateWinner(cells);
    if (winner === ROBOT) return 1_000_000 + depth;
    if (winner === HUMAN) return -1_000_000 - depth;
    if (depth === 0) return evaluatePosition(cells);

    const moves = orderMoves(getLegalMoves(cells, activeBoard));
    if (moves.length === 0) return evaluatePosition(cells);

    if (isRobotTurn) {
        let bestScore = -Infinity;
        for (const move of moves) {
            const nextCells = simulateMove(cells, move, ROBOT);
            bestScore = Math.max(bestScore, minimax(
                nextCells,
                getDirectedBoard(move),
                depth - 1,
                alpha,
                beta,
                false,
            ));
            alpha = Math.max(alpha, bestScore);
            // Ova grana više ne može da promeni odluku, pa se prekida pretraga.
            if (beta <= alpha) break;
        }
        return bestScore;
    }

    let bestScore = Infinity;
    for (const move of moves) {
        const nextCells = simulateMove(cells, move, HUMAN);
        bestScore = Math.min(bestScore, minimax(
            nextCells,
            getDirectedBoard(move),
            depth - 1,
            alpha,
            beta,
            true,
        ));
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break;
    }
    return bestScore;
}

export function chooseMinimaxMove(cells, activeBoard) {
    const moves = orderMoves(getLegalMoves(cells, activeBoard));
    if (moves.length === 0) return null;

    let bestMove = moves[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;

    for (const move of moves) {
        const score = minimax(
            simulateMove(cells, move, ROBOT),
            getDirectedBoard(move),
            SEARCH_DEPTH - 1,
            alpha,
            Infinity,
            false,
        );

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
    }

    return bestMove;
}
