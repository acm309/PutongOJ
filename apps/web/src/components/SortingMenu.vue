<script setup lang="ts">
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  options: {
    label: string
    value: string
    isTimeBased?: boolean
  }[]
  field?: string
  order?: number
}>()
const emit = defineEmits<{
  (e: 'sort', event: { field?: string, order?: number }): void
}>()

const { t } = useI18n()

const sortingMenu = ref<any>(null)
const sortingMenuItems = computed(() => [ {
  label: t('ptoj.sort_by'),
  items: props.options.map(option => ({
    label: option.label,
    checked: props.field === option.value,
    command: () => emit('sort', { field: option.value }),
  })),
}, {
  separator: true,
}, {
  label: t('ptoj.sort_order'),
  items: [ {
    label: props.options.find(o => o.value === props.field)?.isTimeBased
      ? t('ptoj.newest')
      : t('ptoj.descending'),
    icon: 'pi pi-sort-amount-down',
    checked: props.order === -1,
    command: () => emit('sort', { order: -1 }),
  }, {
    label: props.options.find(o => o.value === props.field)?.isTimeBased
      ? t('ptoj.oldest')
      : t('ptoj.ascending'),
    icon: 'pi pi-sort-amount-up-alt',
    checked: props.order === 1,
    command: () => emit('sort', { order: 1 }),
  } ],
} ])
</script>

<template>
  <Button
    type="button" severity="secondary" outlined
    :icon="props.order === 1 ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'" @click="sortingMenu?.toggle"
  />
  <Menu ref="sortingMenu" :model="sortingMenuItems" :popup="true">
    <template #item="{ item, props: itemsProps }">
      <a class="flex items-center justify-between" v-bind="itemsProps.action">
        <span class="flex gap-2 items-center">
          <span v-if="item.icon" :class="item.icon" />
          <span>{{ item.label }}</span>
        </span>
        <span v-if="item.checked" class="pi pi-check" />
      </a>
    </template>
  </Menu>
</template>
