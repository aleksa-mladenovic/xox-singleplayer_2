<template>
    <button
        class="cell"
        type="button"
        :aria-label="label"
        :class="{ 'cell--active': isAllowed && mark === EMPTY }"
        :disabled="mark !== EMPTY || !isAllowed" @click="$emit('select')"
    >
        <img
            v-if="markIcon"
            class="mark"
            :src="markIcon"
        />
    </button>
</template>

<script setup>
import { computed } from 'vue'

import humanIcon from '../assets/icons/human.svg'
import humanLastIcon from '../assets/icons/human-last.svg'
import robotIcon from '../assets/icons/robot.svg'
import robotLastIcon from '../assets/icons/robot-last.svg'
import { EMPTY, HUMAN, ROBOT } from '../game/gameRules.js'

const props = defineProps({
    mark: { type: String, required: true },
    isAllowed: { type: Boolean, required: true },
    isLatest: { type: Boolean, default: false },
    label: { type: String, required: true },
})

defineEmits(['select'])

const markIcon = computed(() => {
    if (props.mark === HUMAN) {
        if (props.isLatest) return humanLastIcon

        return humanIcon
    }

    if (props.mark === ROBOT) {
        if (props.isLatest) return robotLastIcon

        return robotIcon
    }

    return null
})
</script>

<style scoped>
.cell {
    display: grid;
    aspect-ratio: 1;
    min-width: 0;
    padding: 0;
    border: 0;
    cursor: default;
    place-items: center;
    background: #1c274b;
}
.cell--active {
    cursor: pointer;
}
.cell--active:hover {
    background: #2e4180;
}
.cell:focus-visible {
    outline: 3px solid #f9ca62;
    outline-offset: -3px;
}
.mark {
    width: 68%;
    height: 68%;
}
</style>
