<template>
    <main class="game-page">
        <section class="game-card" aria-labelledby="game-title">
            <div class="title-row">
                <div>
                    <p class="eyebrow">SINGLEPLAYER</p>
                    <h1 id="game-title">Ultimate XOX</h1>
                </div>
                <div class="title-actions">
                    <GameDifficulty v-model="difficulty" :disabled="game.history.length > 0" />
                    <button class="reset-button" type="button" @click="startNewGame">
                        Nova tabla
                    </button>
                </div>
            </div>

            <div class="game-meta">
                <GameStatus
                    :cells="game.cells"
                    :active-board="game.activeBoard"
                    :is-thinking="isRobotThinking"
                    :error="aiError"
                    :winner="game.winner"
                    @retry-ai="requestRobotMove"
                />
                <GameTimer
                    :key="gameKey"
                    :is-game-running="game.lastMove !== null && game.winner === 'empty'"
                    :is-human-turn="game.lastMove !== null && game.winner === 'empty' && !isRobotThinking && !aiError"
                    @time-expired="handleTurnTimeout"
                    @update:seconds="elapsedSeconds = $event"
                />
            </div>

            <GameResult
                v-if="game.winner !== 'empty' && !showReplay"
                :winner="game.winner"
                :seconds="elapsedSeconds"
                :rounds="roundCount"
                @new-game="startNewGame"
                @replay="showReplay = true"
            />

            <UltimateBoard
                v-if="!showReplay"
                :cells="game.cells"
                :active-board="game.activeBoard"
                :last-move="game.lastMove"
                :is-locked="isRobotThinking || Boolean(aiError) || game.winner !== 'empty'"
                @select-cell="handleCellSelection"
            />

            <GameReplay
                v-else-if="showReplay"
                :history="game.history"
                @close="showReplay = false"
            />
        </section>
    </main>
</template>

<script setup>
import { computed, ref } from 'vue'

import GameDifficulty from './components/GameDifficulty.vue'
import GameReplay from './components/GameReplay.vue'
import GameResult from './components/GameResult.vue'
import GameStatus from './components/GameStatus.vue'
import GameTimer from './components/GameTimer.vue'
import UltimateBoard from './components/UltimateBoard.vue'
import { AI_DIFFICULTIES, chooseRobotMove } from './game/aiEngine.js'
import { createGameState, playHumanMove, playRobotMove } from './game/gameEngine.js'
import { getLegalMoves } from './game/gameRules.js'

const game = ref(createGameState())
const gameKey = ref(0)
const isRobotThinking = ref(false)
const aiError = ref('')
const aiRequestVersion = ref(0)
const difficulty = ref(AI_DIFFICULTIES.MINIMAX)
const elapsedSeconds = ref(0)
const showReplay = ref(false)

const roundCount = computed(() => Math.ceil(game.value.history.length / 2))

async function requestRobotMove() {
    // Ne upisujemo stari odgovor ako je korisnik u međuvremenu otvorio novu partiju.
    const requestVersion = ++aiRequestVersion.value

    isRobotThinking.value = true
    aiError.value = ''

    try {
        const { move } = await chooseRobotMove(game.value, difficulty.value)

        if (requestVersion !== aiRequestVersion.value) return

        game.value = playRobotMove(game.value, move)
    } catch (error) {
        if (requestVersion !== aiRequestVersion.value) return

        let errorMessage = 'AI potez nije uspeo.'

        if (error.message) {
            errorMessage = error.message
        }

        aiError.value = errorMessage
    } finally {
        if (requestVersion === aiRequestVersion.value) {
            isRobotThinking.value = false
        }
    }
}

async function handleCellSelection(cellIndex) {
    if (isRobotThinking.value || aiError.value) return

    const afterHumanMove = playHumanMove(game.value, cellIndex)

    if (afterHumanMove === game.value) return

    game.value = afterHumanMove

    if (game.value.winner !== 'empty') return

    await requestRobotMove()
}

async function handleTurnTimeout() {
    if (isRobotThinking.value || aiError.value || game.value.winner !== 'empty') return

    const legalMoves = getLegalMoves(game.value.cells, game.value.activeBoard)

    if (legalMoves.length === 0) return

    const randomIndex = Math.floor(Math.random() * legalMoves.length)
    const automaticMove = legalMoves[randomIndex]

    await handleCellSelection(automaticMove)
}

function startNewGame() {
    // Time se poništava i eventualni odgovor za prethodnu partiju.
    aiRequestVersion.value += 1
    game.value = createGameState()
    gameKey.value += 1
    aiError.value = ''
    isRobotThinking.value = false
    elapsedSeconds.value = 0
    showReplay.value = false
}
</script>

<style>
:root {
    color: #f7f9ff;
    background: #10162b;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
    box-sizing: border-box;
}

body {
    min-width: 320px;
    min-height: 100vh;
    margin: 0;
}

button {
    font: inherit;
}

.game-page {
    display: grid;
    min-height: 100vh;
    padding: 32px 20px;
    place-items: center;
    background:
        radial-gradient(circle at 12% 8%, #334a9a 0, transparent 30rem),
        radial-gradient(circle at 88% 92%, #40277d 0, transparent 28rem),
        #10162b;
}

.game-card {
    width: min(100%, 680px);
    padding: clamp(22px, 5vw, 42px);
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 28px;
    background: rgb(20 28 53 / 84%);
    box-shadow: 0 24px 70px rgb(0 0 0 / 30%);
    backdrop-filter: blur(12px);
}

.title-row,
.game-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
}

.title-actions {
    display: flex;
    align-items: flex-end;
    gap: 10px;
}

.eyebrow {
    margin: 0 0 5px;
    color: #91a6ff;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.16em;
}

h1 {
    margin: 0;
    font-size: clamp(2rem, 7vw, 3.25rem);
    letter-spacing: -0.055em;
}

.game-meta {
    margin: 20px 0 28px;
}

.reset-button {
    padding: 10px 14px;
    border: 1px solid #7188ed;
    border-radius: 10px;
    color: #e7ebff;
    cursor: pointer;
    background: #26366f;
}

.reset-button:hover {
    background: #344989;
}

.reset-button:focus-visible {
    outline: 3px solid #f9ca62;
    outline-offset: -3px;
}

@media (max-width: 440px) {
    .game-page {
        padding: 16px 10px;
    }

    .game-card {
        border-radius: 18px;
    }

    .title-row,
    .game-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;
    }

    .title-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .game-meta {
        margin-bottom: 22px;
    }
}
</style>
