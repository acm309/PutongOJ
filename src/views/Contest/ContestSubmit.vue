<script setup>
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Submit from '@/components/Submit'
import { useSolutionStore } from '@/store/modules/solution'
import { useContestStore } from '@/store/modules/contest'

const contestStore = useContestStore()
const solutionStore = useSolutionStore()
const route = useRoute()
const router = useRouter()
const $Message = inject('$Message')

const { problems, overview } = $(storeToRefs(contestStore))
const { solution } = $(storeToRefs(solutionStore))
const { clearCode, create } = solutionStore

const title = $computed(() => overview[+route.params.id - 1]?.title)

const reset = clearCode

async function submit () {
  await create(Object.assign({}, solution, {
    pid: problems[+route.params.id - 1],
    mid: route.params.cid,
  }))
  router.push({
    name: 'contestStatus', params: route.params,
  })
  $Message.info(`submit id:${route.params.id} success!`)
}
</script>

<template>
  <div>
    <h1>{{ $route.params.id }}:  {{ title }}</h1>
    <Submit />
    <Button type="primary" @click="submit">
      Submit
    </Button>
    <Button style="margin-left: 8px" @click="reset">
      Reset
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
h1
  color: #9799ca
  margin-top: 10px
  margin-bottom: 20px
  text-align:center
</style>
