<template>
    <section class="mini-board" :class="{ 'mini-board--active': isActive }" :aria-label="`Mini tabla ${boardIndex + 1}`">
        <GameCell
            v-for="(mark, cellIndex) in cells"
            :key="cellIndex"
            :mark="mark"
            :is-allowed="isActive && !isLocked"
            :is-latest="lastMove === boardIndex * 9 + cellIndex"
            :label="`Mini tabla ${boardIndex + 1}, red ${Math.floor(cellIndex / 3) + 1}, kolona ${(cellIndex % 3) + 1}`"
            @select="$emit('select-cell', boardIndex * 9 + cellIndex)"
        />
        <div v-if="winner !== EMPTY" class="winner-overlay" :aria-label="winnerLabel">
            <img :src="winnerIcon" alt="" />
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue'

import humanIcon from '../assets/icons/human.svg'
import humanLastIcon from '../assets/icons/human-last.svg'
import robotIcon from '../assets/icons/robot.svg'
import robotLastIcon from '../assets/icons/robot-last.svg'
import GameCell from './GameCell.vue'
import { EMPTY, HUMAN, ROBOT, getMiniBoardWinner } from '../game/gameRules.js'

const props = defineProps({
    boardIndex: { type: Number, required: true },
    cells: { type: Array, required: true },
    isActive: { type: Boolean, required: true },
    lastMove: { type: Number, default: null },
    isLocked: { type: Boolean, default: false },
})

defineEmits(['select-cell'])

const winner = computed(() => getMiniBoardWinner(props.cells, 0))
const containsLastMove = computed(() => {
    if (props.lastMove === null) return false

    return Math.floor(props.lastMove / 9) === props.boardIndex
})

const winnerLabel = computed(() => {
    if (winner.value === HUMAN) return 'Čovek je osvojio mini-tablu'
    if (winner.value === ROBOT) return 'Robot je osvojio mini-tablu'

    return ''
})

const winnerIcon = computed(() => {
    if (winner.value === HUMAN) {
        if (containsLastMove.value) return humanLastIcon

        return humanIcon
    }

    if (winner.value === ROBOT) {
        if (containsLastMove.value) return robotLastIcon

        return robotIcon
    }

    return null
})
</script>

<style scoped>
.mini-board {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    aspect-ratio: 1;
    overflow: hidden;
    border: 2px solid transparent;
    border-radius: 6px;
    background: #485baf;
}

.mini-board--active {
    border-color: #f9ca62;
    box-shadow: 0 0 0 1px rgb(249 202 98 / 35%);
}

.winner-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgb(13 20 43 / 88%);
}

.winner-overlay img {
    width: 64%;
    height: 64%;
}
</style>
