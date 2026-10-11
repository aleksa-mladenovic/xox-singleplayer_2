import { getLegalMoves } from './gameRules.js';
import { chooseMinimaxMove } from './minimaxEngine.js';

export const AI_DIFFICULTIES = {
    CHATGPT: 'chatgpt',
    MINIMAX: 'minimax',
};

async function chooseChatGptMove(gameState) {
    const { cells, activeBoard, previousActiveBoard, gameId, lastMove } = gameState;
    const legalMoves = getLegalMoves(cells, activeBoard);

    const response = await fetch('/api/ai-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cells,
            activeBoard,
            previousActiveBoard,
            gameId,
            lastMove,
        }),
    });

    const result = await response.json();

    if (!response.ok) {
        let errorMessage = 'AI potez nije uspeo.';

        if (result.error) {
            errorMessage = result.error;
        }

        throw new Error(errorMessage);
    }

    if (!legalMoves.includes(result.move)) {
        throw new Error('AI je vratio neispravan potez.');
    }

    return result;
}

export async function chooseRobotMove(gameState, difficulty) {
    if (difficulty === AI_DIFFICULTIES.MINIMAX) {
        const move = chooseMinimaxMove(gameState.cells, gameState.activeBoard);
        return {
            move,
            reasoning: 'Minimax sa alpha-beta pruningom je izabrao potez sa najboljom evaluacijom pozicije.',
        };
    }

    return chooseChatGptMove(gameState);
}
