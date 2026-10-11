import { EMPTY, HUMAN, ROBOT, getMiniBoardWinner, getUltimateWinner } from './gameRules.js';

const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

const CORNER_CELL_INDICES = [0, 2, 6, 8];

const META_BOARD_WEIGHTS = [3, 2, 3, 2, 4, 2, 3, 2, 3];

function scoreLine(marks, line) {
    // Linija sa oznakama oba igrača nema poene jer više ne može da donese pobedu.
    let robotCount = 0;
    let humanCount = 0;

    for (const cellIndex of line) {
        const mark = marks[cellIndex];

        if (mark === ROBOT) robotCount += 1;
        if (mark === HUMAN) humanCount += 1;
    }

    if (robotCount === 2 && humanCount === 0) return 90;
    if (humanCount === 2 && robotCount === 0) return -110;
    if (robotCount === 1 && humanCount === 0) return 8;
    if (humanCount === 1 && robotCount === 0) return -10;
    return 0;
}

function scoreMiniBoard(cells, boardIndex) {
    const start = boardIndex * 9;
    const marks = cells.slice(start, start + 9);
    const winner = getMiniBoardWinner(cells, boardIndex);

    if (winner === ROBOT) return 850 * META_BOARD_WEIGHTS[boardIndex];
    if (winner === HUMAN) return -950 * META_BOARD_WEIGHTS[boardIndex];

    let score = 0;

    for (const line of LINES) {
        score += scoreLine(marks, line);
    }

    if (marks[4] === ROBOT) score += 18;
    if (marks[4] === HUMAN) score -= 22;

    for (const cellIndex of CORNER_CELL_INDICES) {
        if (marks[cellIndex] === ROBOT) score += 6;
        if (marks[cellIndex] === HUMAN) score -= 7;
    }

    return score * META_BOARD_WEIGHTS[boardIndex];
}

export function evaluatePosition(cells) {
    const winner = getUltimateWinner(cells);
    if (winner === ROBOT) return 1_000_000;
    if (winner === HUMAN) return -1_000_000;

    const miniBoardWinners = [];
    let miniBoardScore = 0;

    for (let boardIndex = 0; boardIndex < 9; boardIndex += 1) {
        miniBoardWinners.push(getMiniBoardWinner(cells, boardIndex));
        miniBoardScore += scoreMiniBoard(cells, boardIndex);
    }

    let metaBoardLineScore = 0;

    for (const line of LINES) {
        metaBoardLineScore += scoreLine(miniBoardWinners, line) * 12;
    }

    return miniBoardScore + metaBoardLineScore;
}

export function getMovePreference(cellIndex) {
    const miniBoardIndex = Math.floor(cellIndex / 9);
    const innerCellIndex = cellIndex % 9;
    return META_BOARD_WEIGHTS[miniBoardIndex] * 10 + META_BOARD_WEIGHTS[innerCellIndex];
}

export { EMPTY };
