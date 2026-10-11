<template>
    <p
        v-if="isHumanTurn"
        class="timer"
        aria-label="Preostalo vreme za potez"
    >
        Tvoj potez: {{ formattedTurnTime }}
    </p>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
    isGameRunning: { type: Boolean, default: false },
    isHumanTurn: { type: Boolean, default: false },
})

const emit = defineEmits(['time-expired', 'update:seconds'])

const seconds = ref(0)
const secondsLeft = ref(20)
let gameTimerId = null
let turnTimerId = null

function stopGameTimer() {
    if (gameTimerId === null) return

    window.clearInterval(gameTimerId)
    gameTimerId = null
}

function stopTurnTimer() {
    if (turnTimerId === null) return

    window.clearInterval(turnTimerId)
    turnTimerId = null
}

watch(
    () => props.isGameRunning,
    (shouldRun) => {
        stopGameTimer()

        if (!shouldRun) return

        gameTimerId = window.setInterval(() => {
            seconds.value += 1
            emit('update:seconds', seconds.value)
        }, 1000)
    },
    { immediate: true },
)

watch(
    () => props.isHumanTurn,
    (isHumanTurn) => {
        stopTurnTimer()

        if (!isHumanTurn) return

        secondsLeft.value = 20
        turnTimerId = window.setInterval(() => {
            secondsLeft.value -= 1

            if (secondsLeft.value > 0) return

            stopTurnTimer()
            emit('time-expired')
        }, 1000)
    },
    { immediate: true },
)

const formattedTurnTime = computed(() => {
    const minutes = Math.floor(secondsLeft.value / 60).toString().padStart(2, '0')
    const remainingSeconds = (secondsLeft.value % 60).toString().padStart(2, '0')

    return `${minutes}:${remainingSeconds}`
})

onBeforeUnmount(() => {
    stopGameTimer()
    stopTurnTimer()
})
</script>

<style scoped>
.timer {
    margin: 0;
    color: #91a6ff;
    font-variant-numeric: tabular-nums;
    font-weight: 800;
}
</style>
