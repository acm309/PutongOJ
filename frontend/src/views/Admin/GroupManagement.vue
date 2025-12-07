<script setup lang="ts">
import type {
  AdminGroupDetailQueryResult,
  AdminGroupMembersUpdatePayload,
  GroupListQueryResult,
  UserItemListQueryResult,
} from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useConfirm } from 'primevue/useconfirm'
import VirtualScroller from 'primevue/virtualscroller'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  createGroup,
  getGroup,
  removeGroup,
  updateGroup,
  updateGroupMembers,
} from '@/api/admin'
import { findGroups } from '@/api/group'
import { getAllUserItems } from '@/api/user'
import { useSessionStore } from '@/store/modules/session'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const confirm = useConfirm()

const { isRoot } = storeToRefs(useSessionStore())

const groupId = ref<number | null>(null)
const groups = ref<GroupListQueryResult>([])
const currentGroup = ref<AdminGroupDetailQueryResult | null>(null)
const allUsers = ref<UserItemListQueryResult>([])
const loading = ref(false)
const loadingGroups = ref(false)
const loadingGroupDetail = ref(false)
const createDialog = ref(false)
const editDialog = ref(false)
const newGroupName = ref('')
const editGroupName = ref('')
const sourceSearch = ref('')
const targetSearch = ref('')
const selectedSourceUsers = ref<Set<string>>(new Set())
const selectedTargetUsers = ref<Set<string>>(new Set())

const userMap = computed(() => {
  const map = new Map<string, UserItemListQueryResult[number]>()
  allUsers.value.forEach((user) => {
    map.set(user.uid, user)
  })
  return map
})

const filteredSourceUsers = computed(() => {
  let users = allUsers.value
    .filter(user => !currentGroup.value?.members.includes(user.uid))
    .map(user => userMap.value.get(user.uid)!)

  if (sourceSearch.value.trim()) {
    const searchTerm = sourceSearch.value.toLowerCase()
    users = users.filter(user =>
      user.uid.toLowerCase().includes(searchTerm)
      || user.nick?.toLowerCase().includes(searchTerm),
    )
  }
  return users
})

const filteredTargetUsers = computed(() => {
  if (!currentGroup.value) return []

  let users = allUsers.value
    .filter(user => currentGroup.value?.members.includes(user.uid))
    .map(user => userMap.value.get(user.uid)!)

  if (targetSearch.value.trim()) {
    const searchTerm = targetSearch.value.toLowerCase()
    users = users.filter(user =>
      user.uid.toLowerCase().includes(searchTerm)
      || user.nick?.toLowerCase().includes(searchTerm),
    )
  }
  return users
})

function resetSelections () {
  selectedSourceUsers.value.clear()
  selectedTargetUsers.value.clear()
}

function toggleSourceSelection (uid: string) {
  if (selectedSourceUsers.value.has(uid)) {
    selectedSourceUsers.value.delete(uid)
  } else {
    selectedSourceUsers.value.add(uid)
  }
}

function toggleTargetSelection (uid: string) {
  if (selectedTargetUsers.value.has(uid)) {
    selectedTargetUsers.value.delete(uid)
  } else {
    selectedTargetUsers.value.add(uid)
  }
}

function selectAllSource () {
  if (selectedSourceUsers.value.size === filteredSourceUsers.value.length) {
    selectedSourceUsers.value.clear()
  } else {
    selectedSourceUsers.value = new Set(filteredSourceUsers.value.map(user => user.uid))
  }
}

function selectAllTarget () {
  if (selectedTargetUsers.value.size === filteredTargetUsers.value.length) {
    selectedTargetUsers.value.clear()
  } else {
    selectedTargetUsers.value = new Set(filteredTargetUsers.value.map(user => user.uid))
  }
}

function moveToTarget () {
  if (selectedSourceUsers.value.size === 0) return

  const updatedMembers = [
    ...(currentGroup.value?.members || []),
    ...Array.from(selectedSourceUsers.value),
  ]

  if (currentGroup.value) {
    currentGroup.value.members = updatedMembers
  }
  resetSelections()
}

function moveToSource () {
  if (selectedTargetUsers.value.size === 0) return

  const updatedMembers = (currentGroup.value?.members || []).filter(
    uid => !selectedTargetUsers.value.has(uid),
  )

  if (currentGroup.value) {
    currentGroup.value.members = updatedMembers
  }
  resetSelections()
}

async function fetchUsers () {
  const resp = await getAllUserItems()
  if (resp.success) {
    allUsers.value = resp.data
  } else {
    message.error(t('ptoj.failed_fetch_users'), resp.message)
    allUsers.value = []
  }
}

async function fetchGroups () {
  loadingGroups.value = true
  const resp = await findGroups()
  loadingGroups.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_groups'), resp.message)
    return
  }
  groups.value = resp.data
}

async function fetchGroupDetail () {
  if (!groupId.value) {
    currentGroup.value = null
    return
  }

  loadingGroupDetail.value = true
  const resp = await getGroup(groupId.value.toString())
  loadingGroupDetail.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_load_group'), resp.message)
    currentGroup.value = null
    return
  }
  currentGroup.value = resp.data
  editGroupName.value = resp.data.name
  resetSelections()
}

async function fetch () {
  if (route.query.group) {
    const id = Number(route.query.group)
    if (Number.isNaN(id) || !Number.isInteger(id) || id < 0) {
      return onReset()
    }
    groupId.value = id
    if (!groups.value.find(g => g.gid === groupId.value)) {
      return onReset()
    }
    await fetchGroupDetail()
  } else {
    groupId.value = null
    currentGroup.value = null
    resetSelections()
  }
}

function onReset () {
  sourceSearch.value = ''
  targetSearch.value = ''
  router.replace({ query: { group: undefined } })
}

function onSelect () {
  router.replace({
    query: {
      group: groupId.value?.toString() || undefined,
    },
  })
}

async function handleCreateGroup () {
  const name = newGroupName.value.trim()
  if (/.{4,79}/.test(name) === false) {
    message.error(t('ptoj.group_name_invalid'), t('ptoj.group_name_invalid_detail'))
    return
  }

  loading.value = true
  const resp = await createGroup({ name })
  loading.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_create_group'), resp.message)
    return
  }

  message.success(
    t('ptoj.successful_create_group'),
    t('ptoj.successful_create_group_detail', { name }),
  )
  createDialog.value = false
  newGroupName.value = ''
  await fetchGroups()

  groupId.value = resp.data.groupId
  onSelect()
}

async function handleUpdateGroupName () {
  if (!currentGroup.value) return
  const name = editGroupName.value.trim()

  if (/.{4,79}/.test(name) === false) {
    message.error(t('ptoj.group_name_invalid'), t('ptoj.group_name_invalid_detail'))
    return
  }
  if (name === currentGroup.value.name) {
    editDialog.value = false
    return
  }

  loading.value = true
  const resp = await updateGroup(currentGroup.value.groupId.toString(), { name })
  loading.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_save_changes'), resp.message)
    return
  }

  message.success(
    t('ptoj.successful_update_group'),
    t('ptoj.successful_update_group_detail', { name }),
  )
  editDialog.value = false
  await Promise.all([ fetchGroupDetail(), fetchGroups() ])
}

async function handleSaveMembers () {
  if (!currentGroup.value) return

  loading.value = true
  const payload: AdminGroupMembersUpdatePayload = {
    members: currentGroup.value.members,
  }

  const resp = await updateGroupMembers(currentGroup.value.groupId.toString(), payload)
  loading.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_save_changes'), resp.message)
    return
  }

  message.success(
    t('ptoj.successful_update_group_members'),
    t('ptoj.successful_update_group_members_detail', {
      name: currentGroup.value.name,
      count: resp.data.modifiedCount,
    }),
  )
  await fetchGroupDetail()
}

async function handleDeleteGroup (event: Event) {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: t('ptoj.delete_confirm_message'),
    rejectProps: {
      label: t('ptoj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('ptoj.delete'),
      severity: 'danger',
    },
    accept: async () => {
      loading.value = true
      const resp = await removeGroup(currentGroup.value!.groupId.toString())
      loading.value = false

      if (!resp.success) {
        message.error(t('ptoj.failed_delete_group'), resp.message)
        return
      }

      message.success(
        t('ptoj.successful_delete_group'),
        t('ptoj.successful_delete_group_detail', { name: currentGroup.value!.name }),
      )
      onReset()
      await fetchGroups()
    },
  })
}

async function init () {
  await Promise.all([
    fetchGroups(),
    fetchUsers(),
  ])
  await fetch()
}

onMounted(init)
onRouteQueryUpdate(fetch)
watch([ sourceSearch, targetSearch ], resetSelections)
</script>

<template>
  <div class="max-w-7xl p-0">
    <div class="pt-6 px-6">
      <div class="flex font-semibold gap-4 items-center mb-4">
        <i class="pi pi-paperclip text-2xl" />
        <h1 class="text-xl">
          {{ t('ptoj.group_management') }}
        </h1>
      </div>
      <div class="gap-4 grid grid-cols-1 items-end lg:grid-cols-3 md:grid-cols-2">
        <Select
          v-model="groupId" fluid :options="groups" option-label="title" option-value="gid" show-clear
          :placeholder="t('ptoj.select_group')" :loading="loadingGroups" :disabled="loading" @change="onSelect"
        />

        <div class="flex gap-2 items-center justify-end lg:col-span-2 md:col-span-1">
          <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="init" />
          <Button
            icon="pi pi-plus" :label="t('ptoj.create_group')" severity="primary" outlined :disabled="loading"
            @click="createDialog = true"
          />
        </div>
      </div>
    </div>

    <template v-if="!groupId">
      <div class="border-surface border-t flex flex-col gap-4 items-center justify-center mt-6 px-6 py-24 text-center">
        <i class="pi pi-info-circle text-4xl text-muted-color" />
        <div>
          <h3 class="font-semibold mb-2 text-lg">
            {{ t('ptoj.no_group_selected') }}
          </h3>
          <p class="text-muted-color">
            {{ t('ptoj.no_group_selected_desc') }}
          </p>
        </div>
      </div>
    </template>

    <template v-else-if="loadingGroupDetail || !currentGroup">
      <div class="border-surface border-t flex gap-4 items-center justify-center mt-6 px-6 py-24">
        <i class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loadingGroupDetail ? t('ptoj.loading') : t('ptoj.failed_load_group') }}</span>
      </div>
    </template>

    <template v-else>
      <div class="mt-4 pb-6 px-6">
        <div class="flex gap-2 justify-end mb-4">
          <Button
            icon="pi pi-pencil" :label="t('ptoj.rename')" severity="secondary" outlined :disabled="loading"
            @click="editDialog = true"
          />
          <Button
            v-if="isRoot" icon="pi pi-trash" :label="t('ptoj.delete')" severity="danger" outlined
            :disabled="loading" @click="handleDeleteGroup"
          />
        </div>

        <div class="flex flex-col gap-4 mb-4 md:flex-row">
          <div class="border border-surface flex-1 rounded-lg">
            <div class="border-b border-surface p-3">
              <div class="flex items-center justify-between">
                <div class="flex gap-3 items-center">
                  <Checkbox
                    :model-value="selectedSourceUsers.size > 0 && selectedSourceUsers.size === filteredSourceUsers.length"
                    :binary="true" @change="selectAllSource"
                  />
                  <span class="font-semibold">
                    {{ t('ptoj.available_users') }}
                  </span>
                </div>
                <div class="text-muted-color text-sm">
                  {{ filteredSourceUsers.length }}
                </div>
              </div>
              <InputText
                v-model="sourceSearch" :placeholder="t('ptoj.filter_by_username_or_nickname')" fluid
                class="mt-3"
              />
            </div>
            <VirtualScroller :items="filteredSourceUsers" :item-size="39" class="h-96">
              <template #item="{ item }">
                <div
                  class="cursor-pointer flex gap-3 hover:bg-emphasis items-center p-3 text-nowrap transition w-full"
                  @click="toggleSourceSelection(item.uid)"
                >
                  <Checkbox
                    :model-value="selectedSourceUsers.has(item.uid)" :binary="true" @click.stop
                    @change="toggleSourceSelection(item.uid)"
                  />
                  <div>
                    {{ item.uid }}
                    <span v-if="item.nick" class="ml-2 text-muted-color">({{ item.nick }})</span>
                  </div>
                </div>
              </template>
            </VirtualScroller>
          </div>

          <div class="flex gap-2 items-center justify-center md:flex-col md:justify-center md:py-8">
            <Button
              :disabled="selectedSourceUsers.size === 0" class="h-10 w-10"
              :severity="selectedSourceUsers.size === 0 ? 'secondary' : 'primary'" @click="moveToTarget"
            >
              <span class="md:hidden pi pi-arrow-down" />
              <span class="max-md:hidden pi pi-arrow-right" />
            </Button>
            <Button
              :disabled="selectedTargetUsers.size === 0" class="h-10 w-10"
              :severity="selectedTargetUsers.size === 0 ? 'secondary' : 'primary'" @click="moveToSource"
            >
              <span class="md:hidden pi pi-arrow-up" />
              <span class="max-md:hidden pi pi-arrow-left" />
            </Button>
          </div>

          <div class="border border-surface flex-1 rounded-lg">
            <div class="border-b border-surface p-3">
              <div class="flex items-center justify-between">
                <div class="flex gap-3 items-center">
                  <Checkbox
                    :model-value="selectedTargetUsers.size > 0 && selectedTargetUsers.size === filteredTargetUsers.length"
                    :binary="true" @change="selectAllTarget"
                  />
                  <span class="font-semibold">
                    {{ t('ptoj.group_members') }}
                  </span>
                </div>
                <div class="text-muted-color text-sm">
                  {{ filteredTargetUsers.length }}
                </div>
              </div>
              <InputText
                v-model="targetSearch" :placeholder="t('ptoj.filter_by_username_or_nickname')" fluid
                class="mt-3"
              />
            </div>
            <VirtualScroller :items="filteredTargetUsers" :item-size="39" class="h-96">
              <template #item="{ item }">
                <div
                  class="cursor-pointer flex gap-3 hover:bg-emphasis items-center p-3 text-nowrap transition w-full"
                  @click="toggleTargetSelection(item.uid)"
                >
                  <Checkbox
                    :model-value="selectedTargetUsers.has(item.uid)" :binary="true" @click.stop
                    @change="toggleTargetSelection(item.uid)"
                  />
                  <div>
                    {{ item.uid }}
                    <span v-if="item.nick" class="ml-2 text-muted-color">({{ item.nick }})</span>
                  </div>
                </div>
              </template>
            </VirtualScroller>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <Button icon="pi pi-save" :label="t('ptoj.save_changes')" :loading="loading" @click="handleSaveMembers" />
        </div>
      </div>
    </template>

    <Dialog v-model:visible="createDialog" modal :header="t('ptoj.create_group')" class="max-w-md mx-6 w-full">
      <form @submit.prevent="handleCreateGroup">
        <IftaLabel>
          <InputText
            id="new-group-name" v-model="newGroupName" fluid :placeholder="t('ptoj.enter_group_name')"
            required
          />
          <label for="new-group-name">{{ t('ptoj.group_name') }}</label>
        </IftaLabel>
        <div class="flex gap-2 justify-end mt-5">
          <Button
            type="button" :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
            @click="createDialog = false"
          />
          <Button type="submit" :label="t('ptoj.create')" icon="pi pi-check" :loading="loading" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="editDialog" modal :header="t('ptoj.rename_group')" class="max-w-md mx-6 w-full">
      <form @submit.prevent="handleUpdateGroupName">
        <IftaLabel>
          <InputText
            id="edit-group-name" v-model="editGroupName" fluid :placeholder="t('ptoj.enter_group_name')"
            required
          />
          <label for="edit-group-name">{{ t('ptoj.group_name') }}</label>
        </IftaLabel>
        <div class="flex gap-2 justify-end mt-5">
          <Button
            type="button" :label="t('ptoj.cancel')" icon="pi pi-times" severity="secondary" outlined
            @click="editDialog = false"
          />
          <Button type="submit" :label="t('ptoj.save_changes')" icon="pi pi-check" :loading="loading" />
        </div>
      </form>
    </Dialog>
  </div>
</template>
