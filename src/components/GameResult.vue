<template>
    <section class="result" aria-live="polite">
        <p class="result__eyebrow">PARTIJA JE ZAVRŠENA</p>
        <h2>{{ resultMessage }}</h2>
        <p class="result__details">
            Vreme: {{ formatTime(seconds) }} · Runde: {{ rounds }}
        </p>
        <div class="result__actions">
            <button type="button" @click="$emit('replay')">Pregled partije</button>
            <button
                type="button"
                class="result__primary"
                @click="$emit('new-game')"
            >
                Nova partija
            </button>
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue'

import { DRAW, HUMAN } from '../game/gameRules.js'

const props = defineProps({
    winner: { type: String, required: true },
    seconds: { type: Number, required: true },
    rounds: { type: Number, required: true },
})

defineEmits(['new-game', 'replay'])

const resultMessage = computed(() => {
    if (props.winner === DRAW) return 'Partija je nerešena.'
    if (props.winner === HUMAN) return 'Pobedio si!'

    return 'Robot je pobedio.'
})

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0')

    return `${minutes}:${remainingSeconds}`
}
</script>

<style scoped>
.result {
    margin-top: 24px;
    margin-bottom: 16px;
    padding: 22px;
    border: 1px solid #f9ca62;
    border-radius: 16px;
    text-align: center;
    background: rgb(37 43 79 / 85%);
}

.result__eyebrow {
    margin: 0;
    color: #f9ca62;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.12em;
}

h2 {
    margin: 7px 0;
    font-size: 1.65rem;
}

.result__details {
    margin: 0;
    color: #bdc6e8;
}

.result__actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 18px;
}

button {
    padding: 9px 12px;
    border: 1px solid #7188ed;
    border-radius: 9px;
    color: #e7ebff;
    cursor: pointer;
    background: #26366f;
}

.result__primary {
    border-color: #f9ca62;
    color: #1a2140;
    background: #f9ca62;
}
</style>
