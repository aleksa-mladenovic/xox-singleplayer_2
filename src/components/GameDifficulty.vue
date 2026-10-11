<template>
    <label class="difficulty">
        <span>Težina računara</span>
        <select
            :value="modelValue"
            :disabled="disabled"
            @change="$emit('update:modelValue', $event.target.value)"
        >
            <option value="chatgpt">ChatGPT — AI analiza</option>
            <option value="minimax">Minimax — napredni AI</option>
        </select>
    </label>
</template>

<script setup>
defineProps({
    modelValue: { type: String, required: true },
    disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.difficulty {
    display: grid;
    gap: 5px;
    color: #bdc6e8;
    font-size: 0.82rem;
}
.difficulty select {
    padding: 8px 10px;
    border: 1px solid #7188ed;
    border-radius: 8px;
    color: #f7f9ff;
    background: #1c274b;
}
</style>
