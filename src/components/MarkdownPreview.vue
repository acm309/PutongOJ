<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import VditorPreview from 'vditor/dist/method.min'
import 'vditor/dist/index.css'

const { locale } = useI18n()

const props = defineProps(['modelValue'])
const preview = ref(null)
const config = {
    lang: locale.value.replace('-', '_'),
    render: {
        media: {
            enable: false,
        },
    },
}

let rendering = Promise.resolve()
let waiting = false

async function render() {
    if (!preview.value || !props.modelValue || waiting) return

    waiting = true
    try {
        await rendering
    } catch (e) {
        console.error(e)
    }
    waiting = false
    rendering = VditorPreview.preview(
        preview.value,
        props.modelValue,
        config
    )
}

onMounted(render)
watch(() => props.modelValue, render)
</script>

<template>
    <div ref="preview"></div>
</template>
