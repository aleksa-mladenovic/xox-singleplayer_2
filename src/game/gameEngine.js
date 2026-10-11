import { DRAW, EMPTY, HUMAN, ROBOT, getDirectedBoard, getLegalMoves, getUltimateWinner } from './gameRules.js';

function createGameId() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

export function createGameState() {
    return {
        gameId: createGameId(),
        cells: Array(81).fill(EMPTY),
        activeBoard: null,
        previousActiveBoard: null,
        lastMove: null,
        winner: EMPTY,
        history: [],
    };
}

function applyMove(state, cellIndex, mark) {
    if (state.winner !== EMPTY) return state;

    const legalMoves = getLegalMoves(state.cells, state.activeBoard);

    if (!legalMoves.includes(cellIndex)) return state;

    const cells = [...state.cells];
    cells[cellIndex] = mark;
    const ultimateWinner = getUltimateWinner(cells);
    const activeBoard = getDirectedBoard(cellIndex);
    let winner = EMPTY;

    if (ultimateWinner !== EMPTY) {
        winner = ultimateWinner;
    } else {
        const legalMoves = getLegalMoves(cells, activeBoard);

        if (legalMoves.length === 0) {
            winner = DRAW;
        }
    }

    return {
        gameId: state.gameId,
        cells,
        activeBoard,
        previousActiveBoard: state.activeBoard,
        lastMove: cellIndex,
        winner,
        history: [...state.history, { mark, cellIndex }],
    };
}

export function playHumanMove(state, cellIndex) {
    return applyMove(state, cellIndex, HUMAN);
}

export function playRobotMove(state, cellIndex) {
    if (cellIndex === null) return state;

    return applyMove(state, cellIndex, ROBOT);
}
