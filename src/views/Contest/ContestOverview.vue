<script setup>
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useContestStore } from '@/store/modules/contest'
import { formate, timePretty } from '@/util/formate'

const contestStore = useContestStore()

const { contest, overview, solved } = $(storeToRefs(contestStore))

const route = useRoute()
const cid = $computed(() => Number.parseInt(route.params.cid || 1))
</script>

<template>
  <div class="conover-wrap">
    <h2>{{ contest.title }}</h2>
    <h4>Start Time:&nbsp;&nbsp;{{ timePretty(contest.create) }}</h4>
    <h4>End Time:&nbsp;&nbsp;{{ timePretty(contest.end) }}</h4>
    <table>
      <tr>
        <th>#</th>
        <th>ID</th>
        <th>Title</th>
        <th>Ratio</th>
      </tr>
      <tr v-for="(item, index) in overview" :key="item.pid">
        <td>
          <Icon v-if="solved.includes(item.pid)" type="md-checkmark" />
        </td>
        <td>{{ index + 1 }}</td>
        <td>
          <router-link :to="{ name: 'contestProblem', params: { cid, id: index + 1 } }">
            <Button type="text">
              {{ item.title }}
            </Button>
          </router-link>
        </td>
        <td>
          <span>{{ formate(item.solve / (item.submit + 0.000001)) }}</span>&nbsp;
          ({{ item.solve }} / {{ item.submit }})
        </td>
      </tr>
    </table>
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

h2
  text-align: center
  margin-top: 10px
  margin-bottom: 8px
h4
  text-align: center
  margin-bottom: 8px
table
  margin-bottom: 20px
</style>
