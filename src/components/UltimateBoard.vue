<template>
    <div class="ultimate-board" aria-label="Ultimate XOX tabla">
        <MiniBoard
            v-for="boardIndex in 9"
            :key="boardIndex"
            :board-index="boardIndex - 1"
            :cells="cells.slice((boardIndex - 1) * 9, boardIndex * 9)"
            :is-active="isBoardActive(boardIndex - 1)"
            :last-move="lastMove"
            :is-locked="isLocked"
            @select-cell="$emit('select-cell', $event)"
        />
    </div>
</template>

<script setup>
import MiniBoard from './MiniBoard.vue'
import { isMiniBoardPlayable } from '../game/gameRules.js'

const props = defineProps({
    cells: { type: Array, required: true },
    activeBoard: { type: Number, default: null },
    lastMove: { type: Number, default: null },
    isLocked: { type: Boolean, default: false },
})

defineEmits(['select-cell'])

function isBoardActive(boardIndex) {
    const directedBoardIsPlayable = props.activeBoard !== null
        && isMiniBoardPlayable(props.cells, props.activeBoard)

    if (!directedBoardIsPlayable) {
        return isMiniBoardPlayable(props.cells, boardIndex)
    }

    return props.activeBoard === boardIndex
}
</script>

<style scoped>
.ultimate-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(6px, 1.5vw, 12px);
    padding: clamp(6px, 1.5vw, 12px);
    border-radius: 18px;
    background: #7891ff;
}
</style>
