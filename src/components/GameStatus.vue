<template>
    <div class="status">
        <p v-if="winner !== EMPTY" class="winner-message">{{ winnerMessage }}</p>

        <p v-else-if="isThinking">
            Robot razmišlja...
        </p>
        <template v-else-if="error">
            <p>AI potez nije uspeo: {{ error }}</p>
            <button type="button" @click="$emit('retry-ai')">Pokušaj ponovo</button>
        </template>
        <p v-else-if="canChooseAnyBoard">
            Tvoj potez — izaberi bilo koju slobodnu mini-tablu.
        </p>
        <p v-else>
            Tvoj potez — igraj u mini-tabli {{ activeBoard + 1 }}.
        </p>
    </div>
</template>

<script setup>
import { computed } from 'vue'

import { DRAW, EMPTY, HUMAN, isMiniBoardPlayable } from '../game/gameRules.js'

const props = defineProps({
    cells: { type: Array, required: true },
    activeBoard: { type: Number, default: null },
    isThinking: { type: Boolean, default: false },
    error: { type: String, default: '' },
    winner: { type: String, default: EMPTY },
})

defineEmits(['retry-ai'])

const canChooseAnyBoard = computed(() => props.activeBoard === null
    || !isMiniBoardPlayable(props.cells, props.activeBoard))

const winnerMessage = computed(() => {
    if (props.winner === DRAW) {
        return 'Nerešeno — nema više legalnih poteza.'
    }

    if (props.winner === HUMAN) {
        return 'Pobeda! Čovek je osvojio Ultimate XOX.'
    }

    return 'Robot je osvojio Ultimate XOX.'
})
</script>

<style scoped>
.status {
    color: #bdc6e8;
}
.status p {
    margin: 0;
}
.status button {
    margin-top: 8px;
    padding: 7px 10px;
    border: 1px solid #7188ed;
    border-radius: 8px;
    color: #e7ebff;
    cursor: pointer;
    background: #26366f;
}
.winner-message {
    color: #f9ca62;
    font-weight: 800;
}
</style>
