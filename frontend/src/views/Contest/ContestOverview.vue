<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useContestStore } from '@/store/modules/contest'
import { contestLabeling, formate, timePretty } from '@/utils/formate'

const { t } = useI18n()
const contestStore = useContestStore()
const { contest, overview, solved } = $(storeToRefs(contestStore))

const route = useRoute()
const cid = $computed(() => Number.parseInt(route.params.cid || 1))
</script>

<template>
  <div class="contest-children problem-list-wrap">
    <div class="problem-list-header">
      <h2>{{ contest.title }}</h2>
      <h4>Start Time:&nbsp;&nbsp;{{ timePretty(contest.start) }}</h4>
      <h4>End Time:&nbsp;&nbsp;{{ timePretty(contest.end) }}</h4>
    </div>
    <div class="problem-table-container">
      <table class="problem-table">
        <thead>
          <tr>
            <th class="problem-status">
              #
            </th>
            <th class="problem-pid">
              ID
            </th>
            <th class="problem-title">
              Title
            </th>
            <th class="problem-ratio">
              Ratio
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="overview.length === 0" class="status-empty">
            <td colspan="4">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="(item, index) in overview" :key="item.pid">
            <td class="problem-status">
              <Icon v-if="solved.includes(item.pid)" type="md-checkmark" />
            </td>
            <td class="problem-pid">
              {{ contestLabeling(index + 1, contest.option?.labelingStyle) }}
            </td>
            <td class="problem-title">
              <router-link v-if="!item.invalid" :to="{ name: 'contestProblem', params: { cid, id: index + 1 } }">
                <Button type="text" class="table-button">
                  {{ item.title }}
                </Button>
              </router-link>
              <span v-else>{{ t('oj.problem_invalid') }}</span>
            </td>
            <td class="problem-ratio">
              <span v-if="!item.invalid">
                {{ formate(item.solve / (item.submit + 0.000001)) }}
                ({{ item.solve }} / {{ item.submit }})
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
h2
  text-align: center
  margin-top: 10px
  margin-bottom: 8px
h4
  text-align: center
  margin-bottom: 8px

@import '../../styles/common'

.contest-children
  margin-top -16px !important
  padding-top 0
  position relative

.problem-list-wrap
  width 100%
  margin 0 auto
  padding 40px 0
.problem-list-header
  padding 0 40px
  margin-bottom 25px

@media screen and (max-width: 1024px)
  .problem-list-wrap
    padding 20px 0
  .problem-list-header
    padding 0 20px
    margin-bottom 5px
  .problem-status
    padding-left 20px

@media screen and (max-width: 768px)
  .problem-page-table, .problem-page-simple
    display none !important

.problem-table-container
  overflow-x auto
  width 100%
.problem-table
  width 100%
  min-width 768px
  table-layout fixed
  th, td
    padding 0 16px
  tbody tr
    transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7
  .table-button
    padding 0
    border-width 0
    width 100%
    &:hover
      background-color transparent

.problem-status
  width 70px
  text-align center
  padding-left 40px !important
.problem-pid
  width 60px
  text-align center
.problem-title
  .table-button
    text-align left
.problem-ratio
  width 200px

.status-empty
  &:hover
    background-color transparent !important
  td
    margin-bottom 20px
    padding 32px !important
    border-radius 4px
    text-align center
    .empty-icon
      display block
      font-size 32px
</style>
