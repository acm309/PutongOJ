<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Menubar from 'primevue/menubar'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/store/modules/session'
import { useMessage } from '@/utils/message'

const sessionStore = useSessionStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const message = useMessage()
const { toggleAuthnDialog, userLogout } = sessionStore
const { profile, isAdmin, isLogined } = storeToRefs(sessionStore)

const currentRoute = computed(() => route.name)
const profileMenu = ref()

const login = toggleAuthnDialog

function toggleProfileMenu (event: any) {
  profileMenu.value.toggle(event)
}

const menuItems = computed(() => {
  const items = [] as ({
    label: string
    icon: string
    items?: typeof items
  } | {
    label: string
    icon: string
    route: string
  })[]

  items.push({
    label: t('oj.home'),
    icon: 'pi pi-home',
    route: 'home',
  }, {
    label: t('oj.course'),
    icon: 'pi pi-book',
    route: 'courses',
  }, {
    label: t('oj.problem_list'),
    icon: 'pi pi-th-large',
    route: 'problems',
  }, {
    label: t('oj.ranklist'),
    icon: 'pi pi-chart-line',
    route: 'Ranklist',
  }, {
    label: t('oj.contest_list'),
    icon: 'pi pi-trophy',
    route: 'contestList',
  }, {
    label: t('oj.more'),
    icon: 'pi pi-ellipsis-h',
    items: [ {
      label: t('oj.discussion_list'),
      icon: 'pi pi-comments',
      route: 'discuss',
    }, {
      label: t('oj.status_list'),
      icon: 'pi pi-chart-line',
      route: 'status',
    }, {
      label: t('oj.faq'),
      icon: 'pi pi-question-circle',
      route: 'faq',
    } ],
  })

  if (isAdmin.value) {
    items.push({
      label: t('oj.admin'),
      icon: 'pi pi-shield',
      items: [ {
        label: t('oj.create_problem'),
        icon: 'pi pi-plus',
        route: 'problemCreate',
      }, {
        label: t('oj.create_contest'),
        icon: 'pi pi-plus',
        route: 'contestCreate',
      }, {
        label: t('oj.create_news'),
        icon: 'pi pi-plus',
        route: 'newsCreate',
      }, {
        label: t('ptoj.user_management'),
        icon: 'pi pi-users',
        route: 'UserManagement',
      }, {
        label: t('oj.tag_management'),
        icon: 'pi pi-tags',
        route: 'tagManager',
      }, {
        label: t('oj.group_management'),
        icon: 'pi pi-paperclip',
        route: 'groupManager',
      }, {
        label: t('ptoj.solution_management'),
        icon: 'pi pi-copy',
        route: 'SolutionManagement',
      } ],
    })
  }

  return items
})

const profileItems = computed(() => [
  {
    label: t('ptoj.header_profile'),
    icon: 'pi pi-user',
    command: () => {
      router.push({ name: 'UserProfile', params: { uid: profile.value!.uid } })
    },
  },
  {
    label: t('ptoj.header_submissions'),
    icon: 'pi pi-copy',
    command: () => {
      router.push({ name: 'MySubmissions' })
    },
  },
  {
    label: t('ptoj.header_settings'),
    icon: 'pi pi-cog',
    command: () => {
      router.push({ name: 'AccountSettings' })
    },
  },
  {
    separator: true,
  },
  ...(isAdmin
    ? [ {
        label: '[Test] Toggle Dark Mode',
        icon: 'pi pi-lightbulb',
        command: () => {
          document.documentElement.classList.toggle('ptoj-dark-test')
        },
      }, {
        separator: true,
      } ]
    : []
  ),
  {
    label: t('ptoj.logout'),
    icon: 'pi pi-sign-out',
    command: async () => {
      await userLogout()
      router.push({ name: 'home' })
      message.success(t('ptoj.successful_logout'), t('ptoj.goodbye'))
    },
  },
])
</script>

<template>
  <Menubar
    :model="menuItems"
    class="border border-surface border-t-0 border-x-0 fixed h-[62px] left-0 lg:px-10 md:px-8 mx-auto px-6 py-2 right-0 rounded-none shadow-lg top-0 z-50"
  >
    <template #item="{ item, props, hasSubmenu }">
      <router-link v-if="item.route" v-slot="{ href, navigate }" :to="{ name: item.route }" custom>
        <a
          :href="href" v-bind="props.action"
          :class="{ 'text-(--p-primary-color) font-semibold': currentRoute === item.route }" @click="navigate"
        >
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
        </a>
      </router-link>
      <a v-else :href="item.url" :target="item.target" v-bind="props.action">
        <span :class="item.icon" />
        <span>{{ item.label }}</span>
        <span v-if="hasSubmenu" class="pi pi-angle-down pi-fw" />
      </a>
    </template>

    <template #end>
      <div class="flex gap-3 items-center">
        <div v-if="isLogined" class="flex items-center">
          <Button
            text plain class="flex gap-2 items-center p-2 rounded-lg transition-colors"
            @click="toggleProfileMenu"
          >
            <Avatar icon="pi pi-user" shape="circle" />
            <span class="font-medium hidden sm:block">{{ profile!.uid }}</span>
            <i class="pi pi-chevron-down text-xs" />
          </Button>

          <Menu ref="profileMenu" :model="profileItems" popup>
            <template #item="{ item, props }">
              <a class="flex items-center" v-bind="props.action">
                <span :class="item.icon" />
                <span>{{ item.label }}</span>
              </a>
            </template>
          </Menu>
        </div>

        <Button v-else text :label="`${t('oj.login')} / ${t('oj.register')}`" class="font-medium" @click="login" />
      </div>
    </template>
  </Menubar>
</template>
