<script setup lang="ts">
import type { AdminTagCreatePayload, AdminTagListQueryResult } from '@putongoj/shared'
import { tagColors } from '@putongoj/shared'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useConfirm } from 'primevue/useconfirm'
import { capitalize, computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createTag, findTags, updateTag } from '@/api/admin'
import ProblemTag from '@/components/ProblemTag.vue'
import { timePretty } from '@/utils/format'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const message = useMessage()
const confirm = useConfirm()

// Tag list

const tags = ref<AdminTagListQueryResult>([])
const loadingTags = ref(false)

const tagsGroupByColor = computed(() => {
  const map: Record<string, AdminTagListQueryResult> = {}
  for (const tag of tags.value) {
    if (!map[tag.color]) {
      map[tag.color] = []
    }
    map[tag.color].push(tag)
  }
  return map
})

const colorOptions = tagColors.map(color => ({
  label: capitalize(color),
  value: color,
}))

async function fetch () {
  loadingTags.value = true
  const resp = await findTags()
  loadingTags.value = false
  if (!resp.success) {
    message.error(`Failed to load tags: ${resp.message}`)
    return
  }
  tags.value = resp.data
}

// Create Form

const createModal = ref(false)
const creating = ref(false)
const createForm = ref<AdminTagCreatePayload>({ name: '', color: 'default' })

function openCreateModal () {
  createForm.value = { name: '', color: 'default' }
  createModal.value = true
}

function isCreateFormValid () {
  const name = createForm.value.name.trim()
  return name.length > 0 && name.length <= 30 && !!createForm.value.color
}

async function doCreate () {
  creating.value = true
  const resp = await createTag({ ...createForm.value, name: createForm.value.name.trim() })
  creating.value = false
  if (!resp.success) {
    message.error(`Failed to create tag: ${resp.message}`)
    return
  }
  message.success('Tag created!')
  createModal.value = false
  await fetch()
}

async function submitCreate () {
  if (!isCreateFormValid()) {
    message.error(t('oj.form_invalid'))
    return
  }
  const duplicate = tags.value.find(item => item.name === createForm.value.name.trim())
  if (duplicate) {
    confirm.require({
      header: 'Duplicate Tag Name',
      message: `Tag with name "${createForm.value.name.trim()}" already exists. Create it anyway?`,
      acceptProps: { label: 'Create' },
      rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
      accept: doCreate,
    })
  } else {
    await doCreate()
  }
}

// Update Form

type TagItem = AdminTagListQueryResult[number]

const updateModal = ref(false)
const updating = ref(false)
const selectedTag = ref<TagItem | null>(null)
const updateForm = ref<AdminTagCreatePayload>({ name: '', color: 'default' })

const tagCreatedAt = computed(() => {
  if (!selectedTag.value?.createdAt) return ''
  return timePretty(selectedTag.value.createdAt)
})
const tagUpdatedAt = computed(() => {
  if (!selectedTag.value?.updatedAt) return ''
  return timePretty(selectedTag.value.updatedAt)
})

function openUpdateModal (tagId: number) {
  const found = tags.value.find(item => item.tagId === tagId)
  if (!found) return
  selectedTag.value = found
  updateForm.value = { name: found.name, color: found.color }
  updateModal.value = true
}

function isUpdateFormValid () {
  const name = updateForm.value.name.trim()
  return name.length > 0 && name.length <= 30 && !!updateForm.value.color
}

async function submitUpdate () {
  if (!selectedTag.value || !isUpdateFormValid()) {
    message.error(t('oj.form_invalid'))
    return
  }
  updating.value = true
  const resp = await updateTag(
    String(selectedTag.value.tagId),
    { ...updateForm.value, name: updateForm.value.name.trim() },
  )
  updating.value = false
  if (!resp.success) {
    message.error(`Failed to update tag: ${resp.message}`)
    return
  }
  message.success('Tag updated!')
  updateModal.value = false
  await fetch()
}

onBeforeMount(fetch)
</script>

<template>
  <div class="max-w-4xl p-0">
    <!-- Header -->
    <div class="border-b border-surface flex gap-4 items-center justify-between p-6">
      <div class="flex font-semibold gap-4 items-center">
        <i class="pi pi-tags text-2xl" />
        <h1 class="text-xl">
          Tag Management
        </h1>
      </div>
      <Button icon="pi pi-plus" label="Create Tag" @click="openCreateModal" />
    </div>

    <!-- Empty state -->
    <template v-if="tags.length === 0">
      <div class="flex flex-col gap-4 items-center justify-center px-6 py-24 text-center">
        <i class="pi pi-info-circle text-4xl text-muted-color" />
        <div>
          <h3 class="font-semibold mb-2 text-lg">
            No Tags Found
          </h3>
          <p class="text-muted-color">
            There are no tags available. Add some tags to organize your problems!
          </p>
        </div>
      </div>
    </template>

    <!-- Tag list grouped by color -->
    <div v-else class="p-6 space-y-6">
      <template v-for="color in tagColors" :key="color">
        <div v-if="tagsGroupByColor[color]?.length > 0">
          <h3 class="font-semibold mb-2 text-lg">
            {{ capitalize(color) }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <ProblemTag
              v-for="tagItem in tagsGroupByColor[color]" :key="tagItem.tagId" class="cursor-pointer"
              size="large" :name="tagItem.name" :color="color" @click="openUpdateModal(tagItem.tagId)"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Create Dialog -->
    <Dialog v-model:visible="createModal" header="Create Problem Tag" class="max-w-md mx-6 w-full">
      <div class="flex flex-col gap-4">
        <IftaLabel>
          <InputText id="createTagName" v-model="createForm.name" fluid :maxlength="30" placeholder="Enter tag name" />
          <label for="createTagName">{{ t('oj.name') }}</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            id="createTagColor" v-model="createForm.color" :options="colorOptions" option-label="label"
            option-value="value" fluid
          >
            <template #option="{ option }">
              <span>{{ option.label }}</span>
              <ProblemTag :color="option.value" class="ml-auto" :name="option.label" />
            </template>
          </Select>
          <label for="createTagColor">Color</label>
        </IftaLabel>
      </div>

      <template #footer>
        <Button :label="t('ptoj.cancel')" severity="secondary" outlined @click="createModal = false" />
        <Button label="Create" :loading="creating" @click="submitCreate" />
      </template>
    </Dialog>

    <!-- Update Dialog -->
    <Dialog v-model:visible="updateModal" header="Edit Problem Tag" class="max-w-md mx-6 w-full">
      <div class="flex flex-col gap-4">
        <IftaLabel>
          <InputText id="updateTagName" v-model="updateForm.name" fluid :maxlength="30" placeholder="Enter tag name" />
          <label for="updateTagName">{{ t('oj.name') }}</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            id="updateTagColor" v-model="updateForm.color" :options="colorOptions" option-label="label"
            option-value="value" fluid
          >
            <template #option="{ option }">
              <span>{{ option.label }}</span>
              <ProblemTag :color="option.value" class="ml-auto" :name="option.label" />
            </template>
          </Select>
          <label for="updateTagColor">Color</label>
        </IftaLabel>

        <IftaLabel>
          <InputText id="updateTagCreatedAt" :model-value="tagCreatedAt" fluid readonly />
          <label for="updateTagCreatedAt">Created At</label>
        </IftaLabel>

        <IftaLabel>
          <InputText id="updateTagUpdatedAt" :model-value="tagUpdatedAt" fluid readonly />
          <label for="updateTagUpdatedAt">Updated At</label>
        </IftaLabel>
      </div>

      <template #footer>
        <Button :label="t('ptoj.cancel')" severity="secondary" outlined @click="updateModal = false" />
        <Button label="Save" :loading="updating" @click="submitUpdate" />
      </template>
    </Dialog>
  </div>
</template>
