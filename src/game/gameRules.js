export const EMPTY = 'empty';
export const DRAW = 'draw';
export const HUMAN = 'human';
export const ROBOT = 'robot';

const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

function getWinner(marks) {
    for (const line of WINNING_LINES) {
        const firstMark = marks[line[0]];

        if (firstMark === EMPTY) continue;

        let isWinningLine = true;

        for (const cellIndex of line) {
            if (marks[cellIndex] !== firstMark) {
                isWinningLine = false;
                break;
            }
        }

        if (isWinningLine) return firstMark;
    }

    return EMPTY;
}

export function getMiniBoardWinner(cells, boardIndex) {
    const start = boardIndex * 9;
    return getWinner(cells.slice(start, start + 9));
}

export function getUltimateWinner(cells) {
    // Pobednici devet malih tabli prave novu, "meta" XOX tablu.
    const miniBoardWinners = [];

    for (let boardIndex = 0; boardIndex < 9; boardIndex += 1) {
        const boardWinner = getMiniBoardWinner(cells, boardIndex);
        miniBoardWinners.push(boardWinner);
    }

    return getWinner(miniBoardWinners);
}

export function isMiniBoardPlayable(cells, boardIndex) {
    const start = boardIndex * 9;
    const winner = getMiniBoardWinner(cells, boardIndex);

    if (winner !== EMPTY) return false;

    for (let cellIndex = start; cellIndex < start + 9; cellIndex += 1) {
        if (cells[cellIndex] === EMPTY) return true;
    }

    return false;
}

export function getLegalMoves(cells, activeBoard) {
    // Kada usmerena tabla više nije dostupna, igrač može da bira bilo koju slobodnu tablu.
    const playableBoards = [];
    const hasDirectedBoard = activeBoard !== null
        && isMiniBoardPlayable(cells, activeBoard);

    if (hasDirectedBoard) {
        playableBoards.push(activeBoard);
    } else {
        for (let boardIndex = 0; boardIndex < 9; boardIndex += 1) {
            if (isMiniBoardPlayable(cells, boardIndex)) {
                playableBoards.push(boardIndex);
            }
        }
    }

    const legalMoves = [];

    for (const boardIndex of playableBoards) {
        const boardStart = boardIndex * 9;

        for (let cellIndex = 0; cellIndex < 9; cellIndex += 1) {
            const absoluteIndex = boardStart + cellIndex;

            if (cells[absoluteIndex] === EMPTY) {
                legalMoves.push(absoluteIndex);
            }
        }
    }

    return legalMoves;
}

export function getDirectedBoard(cellIndex) {
    return cellIndex % 9;
}
