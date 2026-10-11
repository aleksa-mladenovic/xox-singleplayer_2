<template>
    <section class="replay" aria-label="Pregled partije">
        <div class="replay__header">
            <div>
                <p>REPLAY</p>
                <h2>Potez {{ currentMove }} / {{ history.length }}</h2>
            </div>
            <button type="button" @click="$emit('close')">Zatvori</button>
        </div>

        <UltimateBoard
            :cells="replayCells"
            :active-board="-1"
            :last-move="lastMove"
            is-locked
        />

        <div class="replay__controls">
            <button
                type="button"
                :disabled="currentMove === 0"
                @click="currentMove -= 1"
            >
                Prethodni
            </button>
            <button
                type="button"
                :disabled="currentMove === history.length"
                @click="currentMove += 1"
            >
                Sledeći
            </button>
        </div>
    </section>
</template>

<script setup>
import { computed, ref } from 'vue'

import UltimateBoard from './UltimateBoard.vue'
import { EMPTY } from '../game/gameRules.js'

const props = defineProps({
    history: { type: Array, required: true },
})

defineEmits(['close'])

const currentMove = ref(0)

const replayCells = computed(() => {
    const cells = Array(81).fill(EMPTY)

    const movesToShow = props.history.slice(0, currentMove.value)

    for (const { mark, cellIndex } of movesToShow) {
        cells[cellIndex] = mark
    }

    return cells
})

const lastMove = computed(() => {
    if (currentMove.value === 0) {
        return null
    }

    return props.history[currentMove.value - 1].cellIndex
})
</script>

<style scoped>
.replay {
    margin-top: 24px;
    padding: 20px;
    border: 1px solid #7188ed;
    border-radius: 16px;
    background: rgb(20 28 53 / 92%);
}

.replay__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
}

.replay__header p {
    margin: 0;
    color: #91a6ff;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.14em;
}

h2 {
    margin: 4px 0 0;
    font-size: 1.35rem;
}

button {
    padding: 9px 12px;
    border: 1px solid #7188ed;
    border-radius: 9px;
    color: #e7ebff;
    cursor: pointer;
    background: #26366f;
}

button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
}

.replay__controls {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 16px;
}
</style>
