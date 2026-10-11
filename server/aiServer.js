import 'dotenv/config';
import http from 'node:http';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EMPTY, HUMAN, ROBOT, getDirectedBoard, getLegalMoves, getUltimateWinner } from '../src/game/gameRules.js';

const PORT = 8787;
const OPENAI_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = 'gpt-5.6';
const MAX_REQUEST_SIZE = 10_000;

const GAME_INSTRUCTIONS = `You play as the robot in Ultimate Tic-Tac-Toe.
Choose one move from candidateMoves only. The board has 81 cells: cells 0-8 are mini-board 0, cells 9-17 are mini-board 1, and so on. Values are human, robot, or empty.
Prefer moves that win or block a mini-board, then prefer moves that send the opponent to a difficult mini-board.
Return a detailed but concise, user-facing explanation of the robot's move in two to four sentences. Do not reveal hidden chain-of-thought.
Analyze the preceding human move using previousCells and previousLegalMoves. State whether a better move existed and why; set betterMove to that legal move, or null if no clear better move exists.
Return only the JSON object required by the schema.`;

// Odgovor uvek ima isti oblik, pa ostatak aplikacije ne mora da proverava različite formate.
const RESPONSE_FORMAT = {
    type: 'json_schema',
    name: 'ultimate_xox_move',
    strict: true,
    schema: {
        type: 'object',
        properties: {
            move: { type: 'integer' },
            reasoning: { type: 'string' },
            humanMoveAnalysis: {
                type: 'object',
                properties: {
                    assessment: { type: 'string' },
                    betterMove: { type: ['integer', 'null'] },
                    explanation: { type: 'string' },
                },
                required: ['assessment', 'betterMove', 'explanation'],
                additionalProperties: false,
            },
        },
        required: ['move', 'reasoning', 'humanMoveAnalysis'],
        additionalProperties: false,
    },
};

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(body));
}

function readJson(request) {
    // Ovaj server nema Express, zato telo zahteva čitamo ručno i ograničavamo njegovu veličinu.
    return new Promise((resolve, reject) => {
        let body = '';

        request.on('data', (chunk) => {
            body += chunk;

            if (body.length > MAX_REQUEST_SIZE) {
                reject(new Error('Zahtev je prevelik.'));
                request.destroy();
            }
        });

        request.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error('Neispravan JSON zahtev.'));
            }
        });

        request.on('error', reject);
    });
}

function isBoardIndex(value) {
    return Number.isInteger(value) && value >= 0 && value < 9;
}

function isValidGameState(gameState) {
    if (!gameState || typeof gameState !== 'object') return false;

    const { cells, activeBoard, previousActiveBoard, gameId, lastMove } = gameState;

    if (!Array.isArray(cells) || cells.length !== 81) return false;
    if (activeBoard !== null && !isBoardIndex(activeBoard)) return false;
    if (previousActiveBoard !== null && !isBoardIndex(previousActiveBoard)) return false;
    if (!Number.isInteger(lastMove) || lastMove < 0 || lastMove >= 81) return false;

    // gameId postaje deo imena fajla sa logom, zato prihvatamo samo format vremena iz igre.
    if (typeof gameId !== 'string' || !/^[0-9TZ-]+$/.test(gameId)) return false;

    return true;
}

function simulateMove(cells, move, mark) {
    const nextCells = [...cells];
    nextCells[move] = mark;
    return nextCells;
}

function isRiskyRobotMove(cells, robotMove) {
    const cellsAfterRobotMove = simulateMove(cells, robotMove, ROBOT);
    const humanMoves = getLegalMoves(cellsAfterRobotMove, getDirectedBoard(robotMove));

    for (const humanMove of humanMoves) {
        const cellsAfterHumanMove = simulateMove(cellsAfterRobotMove, humanMove, HUMAN);

        if (getUltimateWinner(cellsAfterHumanMove) === HUMAN) return true;
    }

    return false;
}

function getAiMoveOptions(cells, activeBoard) {
    const legalMoves = getLegalMoves(cells, activeBoard);
    const winningMoves = [];

    for (const move of legalMoves) {
        const cellsAfterMove = simulateMove(cells, move, ROBOT);

        if (getUltimateWinner(cellsAfterMove) === ROBOT) {
            winningMoves.push(move);
        }
    }

    if (winningMoves.length > 0) {
        return { moves: winningMoves, note: 'pobednički potezi robota' };
    }

    const safeMoves = [];

    for (const move of legalMoves) {
        if (!isRiskyRobotMove(cells, move)) {
            safeMoves.push(move);
        }
    }

    if (safeMoves.length > 0) {
        return { moves: safeMoves, note: 'potezi bez neposredne pobede čoveka' };
    }

    return { moves: legalMoves, note: 'svi legalni potezi' };
}

function getHumanMoveContext(cells, lastMove, previousActiveBoard) {
    const previousCells = [...cells];
    previousCells[lastMove] = EMPTY;
    const previousLegalMoves = getLegalMoves(previousCells, previousActiveBoard);
    const immediateWinningMoves = [];

    for (const move of previousLegalMoves) {
        const cellsAfterHumanMove = simulateMove(previousCells, move, HUMAN);

        if (getUltimateWinner(cellsAfterHumanMove) === HUMAN) {
            immediateWinningMoves.push(move);
        }
    }

    return {
        previousCells,
        previousLegalMoves,
        immediateWinningMoves,
    };
}

function formatMove(move) {
    return `mini-tabla ${Math.floor(move / 9) + 1}, polje ${(move % 9) + 1}`;
}

function formatMoves(moves) {
    const moveNames = [];

    for (const move of moves) {
        moveNames.push(formatMove(move));
    }

    return moveNames.join('; ');
}

function writeGameLog(gameState, result, moveOptions) {
    const logDirectory = resolve(process.cwd(), 'logs');
    const logPath = resolve(logDirectory, `partija_${gameState.gameId}.md`);
    const isNewLog = !existsSync(logPath);
    let previousLog = '';

    if (!isNewLog) {
        previousLog = readFileSync(logPath, 'utf8');
    }
    const previousRounds = previousLog.match(/^## \d+\. runda$/gm);
    let roundNumber = 1;

    if (previousRounds) {
        roundNumber = previousRounds.length + 1;
    }

    const humanAnalysis = result.humanMoveAnalysis;
    const reasoning = result.reasoning.replace(/[\r\n]+/g, ' ').trim();
    let betterMoveText = 'nema jasne bolje alternative';

    if (humanAnalysis.betterMove !== null) {
        betterMoveText = formatMove(humanAnalysis.betterMove);
    }

    const logLines = [];

    if (isNewLog) {
        logLines.push(`# Ultimate XOX — partija ${gameState.gameId}`, '');
    }

    logLines.push(
        `## ${roundNumber}. runda`,
        `- Vreme: ${new Date().toISOString()}`,
        '',
        '### Čovekov potez',
        `- Odigrano: ${formatMove(gameState.lastMove)}`,
        '',
        '#### Analiza čovekovog poteza',
        `- Ocena: ${humanAnalysis.assessment}`,
        `- Bolja alternativa: ${betterMoveText}`,
        `- Obrazloženje: ${humanAnalysis.explanation}`,
        '',
        '### Robotov potez',
        `- Odigrano: ${formatMove(result.move)}`,
        `- Izbor kandidata: ${moveOptions.note}`,
        `- Kandidati poslati modelu: ${formatMoves(moveOptions.moves)}`,
        '',
        '#### Obrazloženje robotovog poteza',
        reasoning,
        '',
    );

    mkdirSync(logDirectory, { recursive: true });
    appendFileSync(logPath, `${logLines.join('\n')}\n`, 'utf8');
}

function getAnswerText(openAiResponse) {
    if (!Array.isArray(openAiResponse.output)) {
        throw new Error('OpenAI odgovor nema output listu.');
    }

    let answerText = '';

    for (const item of openAiResponse.output) {
        if (item.type !== 'message') continue;
        if (!Array.isArray(item.content)) continue;

        for (const part of item.content) {
            if (part.type !== 'output_text') continue;
            if (typeof part.text !== 'string') continue;

            answerText += part.text;
        }
    }

    if (!answerText) {
        throw new Error('OpenAI odgovor ne sadrži tekstualni potez.');
    }

    return answerText;
}

async function selectMoveWithOpenAI(gameState) {
    const moveOptions = getAiMoveOptions(gameState.cells, gameState.activeBoard);
    const humanMoveContext = getHumanMoveContext(
        gameState.cells,
        gameState.lastMove,
        gameState.previousActiveBoard,
    );
    const modelInput = {
        cells: gameState.cells,
        activeBoard: gameState.activeBoard,
        legalMoves: getLegalMoves(gameState.cells, gameState.activeBoard),
        candidateMoves: moveOptions.moves,
        previousCells: humanMoveContext.previousCells,
        previousActiveBoard: gameState.previousActiveBoard,
        previousLegalMoves: humanMoveContext.previousLegalMoves,
        immediateHumanWinningMoves: humanMoveContext.immediateWinningMoves,
        humanMove: gameState.lastMove,
    };
    const requestBody = {
        model: OPENAI_MODEL,
        store: false,
        instructions: GAME_INSTRUCTIONS,
        input: JSON.stringify(modelInput),
        text: { format: RESPONSE_FORMAT },
    };

    const startedAt = Date.now();
    console.log(`[AI] Igra ${gameState.gameId}: model dobija ${moveOptions.moves.length} kandidata.`);

    const apiResponse = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
        let errorBody = null;

        try {
            errorBody = await apiResponse.json();
        } catch {
            // Neki mrežni problemi vraćaju prazan ili tekstualni odgovor umesto JSON-a.
        }

        let details = 'Nema dodatne poruke od API-ja.';

        if (errorBody && errorBody.error && typeof errorBody.error.message === 'string') {
            details = errorBody.error.message;
        }

        throw new Error(`OpenAI API ${apiResponse.status}: ${details}`);
    }

    const openAiResponse = await apiResponse.json();
    const answerText = getAnswerText(openAiResponse);
    const result = JSON.parse(answerText);

    const humanMoveAnalysis = result.humanMoveAnalysis;

    if (!Number.isInteger(result.move)) {
        throw new Error('Model nije vratio ispravan indeks poteza.');
    }

    if (!moveOptions.moves.includes(result.move)) {
        throw new Error('Model je izabrao potez van dozvoljenih kandidata.');
    }

    if (typeof result.reasoning !== 'string') {
        throw new Error('Model nije vratio obrazloženje poteza.');
    }

    if (!humanMoveAnalysis) {
        throw new Error('Model nije vratio analizu čovekovog poteza.');
    }

    if (typeof humanMoveAnalysis.assessment !== 'string') {
        throw new Error('Analiza čovekovog poteza nema ocenu.');
    }

    if (typeof humanMoveAnalysis.explanation !== 'string') {
        throw new Error('Analiza čovekovog poteza nema obrazloženje.');
    }

    const suggestedMove = humanMoveAnalysis.betterMove;

    if (suggestedMove !== null) {
        const isSuggestedMoveLegal = humanMoveContext.previousLegalMoves.includes(suggestedMove);

        if (!isSuggestedMoveLegal) {
            throw new Error('Model je predložio nelegalnu alternativu za čoveka.');
        }
    }

    writeGameLog(gameState, result, moveOptions);
    const responseTime = Date.now() - startedAt;
    console.log(`[AI] Model je izabrao ${formatMove(result.move)} za ${responseTime} ms.`);

    return result;
}

const server = http.createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/api/ai-move') {
        sendJson(response, 404, { error: 'Ruta nije pronađena.' });
        return;
    }

    if (!process.env.OPENAI_API_KEY) {
        sendJson(response, 500, { error: 'OPENAI_API_KEY nije postavljen na serveru.' });
        return;
    }

    try {
        const gameState = await readJson(request);

        if (!isValidGameState(gameState)) {
            sendJson(response, 400, { error: 'Neispravno stanje igre.' });
            return;
        }

        const result = await selectMoveWithOpenAI(gameState);
        sendJson(response, 200, result);
    } catch (error) {
        console.error('[AI] Potez nije uspeo:', error.message);
        sendJson(response, 502, { error: error.message });
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`AI server sluša na http://127.0.0.1:${PORT}`);
});
