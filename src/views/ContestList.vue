<script>
import only from 'only'
import { mapActions, mapState } from 'pinia'
import { purify } from '../util/helper'
import constant from '../util/constant'
import { useSessionStore } from '@/store/modules/session'
import { useContestStore } from '@/store/modules/contest'
import { useRootStore } from '@/store'
import { timePretty } from '@/util/formate'

export default {
  data () {
    return {
      currentPage: parseInt(this.$route.query.page) || 1,
      pageSize: parseInt(this.$route.query.pageSize) || 20,
      contestStatus: constant.contestStatus,
      type: constant.contestType,
      contestVisible: constant.status,
      enterPsd: '',
    }
  },
  computed: {
    ...mapState(useContestStore, [ 'list', 'sum' ]),
    ...mapState(useSessionStore, [ 'profile', 'isLogined', 'isAdmin', 'canRemove' ]),
    ...mapState(useRootStore, [ 'status', 'encrypt', 'currentTime' ]),
    query () {
      const opt = only(this.$route.query, 'page pageSize type content')
      return purify(opt)
    },
  },
  created () {
    this.fetch()
  },
  methods: {
    timePretty,
    ...mapActions(useContestStore, [ 'find', 'verify', 'update' ]),
    ...mapActions(useContestStore, {
      remove: 'delete',
    }),
    fetch () {
      this.find(this.query)
      const query = this.$route.query
      this.page = parseInt(query.page) || 1
      this.pageSize = parseInt(query.pageSize) || 20
    },
    reload (payload = {}) {
      const query = Object.assign({}, this.query, payload)
      this.$router.push({
        name: 'contestList',
        query,
      })
    },
    pageChange (val) {
      this.reload({ page: val })
    },
    enter (item) {
      const opt = Object.assign(
        {},
        item,
        { pwd: this.enterPsd },
      )
      this.verify(opt).then((data) => {
        if (data) {
          this.$router.push({ name: 'contestOverview', params: { cid: item.cid } })
        } else {
          this.$Message.error('Wrong password!')
        }
      })
    },
    visit (item) {
      if (!this.isLogined) {
        useSessionStore().toggleLoginState()
      } else if (this.isAdmin || this.profile.verifyContest.includes(+item.cid)) {
        this.$router.push({ name: 'contestOverview', params: { cid: item.cid } })
      } else if (item.start > this.currentTime) {
        this.$Message.error('This contest hasn\'t started yet!')
      } else if (+item.encrypt === this.encrypt.Public) {
        this.$router.push({ name: 'contestOverview', params: { cid: item.cid } })
      } else if (+item.encrypt === this.encrypt.Private) {
        const opt = Object.assign(
          {},
          item,
          { uid: this.profile.uid },
        )
        this.verify(opt).then((data) => {
          if (data) {
            this.$router.push({ name: 'contestOverview', params: { cid: item.cid } })
          } else {
            this.$Message.error('You\'re not invited to attend this contest!')
          }
        })
      } else if (+item.encrypt === this.encrypt.Password) {
        this.$Modal.confirm({
          render: (h) => {
            return h('Input', {
              props: {
                placeholder: 'Please enter password.',
              },
              on: {
                'input': (val) => {
                  this.enterPsd = val
                },
                'on-enter': () => {
                  this.enter(item)
                  this.$Modal.remove()
                },
              },
            })
          },
          onOk: () => {
            this.enter(item)
          },
        })
      }
    },
    async change (contest) {
      contest.status = contest.status === this.status.Reserve
        ? this.status.Available
        : this.status.Reserve
      await this.update(contest)
      this.find(this.query)
    },
    del (cid) {
      this.$Modal.confirm({
        title: '提示',
        content: '<p>此操作将永久删除该文件, 是否继续?</p>',
        onOk: async () => {
          await this.remove({ cid })
          this.$Message.success(`成功删除 ${cid}！`)
        },
        onCancel: () => {
          this.$Message.info('已取消删除！')
        },
      })
    },
  },
  watch: {
    $route (to, from) {
      if (to !== from) { this.fetch() }
    },
  },
}
</script>

<template>
  <div class="con-wrap">
    <table>
      <tr>
        <th>CID</th>
        <th>Title</th>
        <th>Status</th>
        <th>Start Time</th>
        <th>Type</th>
        <th v-if="isAdmin">
          Visible
        </th>
        <th v-if="isAdmin && canRemove">
          Delete
        </th>
      </tr>
      <template v-for="(item, index) in list">
        <tr v-if="isAdmin || item.status === status.Available" :key="index">
          <td>{{ item.cid }}</td>
          <td>
            <Button type="text" @click="visit(item)">
              {{ item.title }}
            </Button>
            <Tooltip content="This item is reserved, no one could see this, except admin" placement="right">
              <strong v-show="item.status === status.Reserve">Reserved</strong>
            </Tooltip>
          </td>
          <td>
            <span v-if="item.start > currentTime" class="ready">Ready</span>
            <span v-if="item.start < currentTime && item.end > currentTime" class="run">Running</span>
            <span v-if="item.end < currentTime" class="end">Ended</span>
          </td>
          <td>
            <span>{{ timePretty(item.start) }}</span>
          </td>
          <td>
            <span :class="{ password: +item.encrypt === encrypt.Password, private: +item.encrypt === encrypt.Private, public: +item.encrypt === encrypt.Public }">
              {{ type[item.encrypt] }}
            </span>
          </td>
          <td v-if="isAdmin">
            <Tooltip content="Click to change status" placement="right">
              <Button type="text" @click="change(item)">
                {{ contestVisible[item.status] }}
              </Button>
            </Tooltip>
          </td>
          <td v-if="isAdmin && canRemove">
            <Button type="text" @click="del(item.cid)">
              Delete
            </Button>
          </td>
        </tr>
      </template>
    </table>
    <Page
      v-model:current="page"
      :total="sum"
      :page-size="pageSize"
      show-elevator
      @on-change="pageChange"
    />
  </div>
</template>

<style lang="stylus" scoped>
@import '../styles/common'

.con-wrap
  margin-bottom: 20px
  table
    margin-bottom: 20px
    th:nth-child(1)
      padding-left: 30px
      width: 5%
    th:nth-child(2)
      width: 30%
    th:nth-child(3)
      width: 10%
    th:nth-child(4)
      width: 15%
    th:nth-child(5)
      width: 10%
    th:nth-child(6)
      width: 10%
    th:nth-child(7)
      width: 10%
    td:nth-child(1)
      padding-left: 30px
  .ready
    font-weight: bold
    color: blue
  .run
    font-weight: bold
    color: red
  .end
    font-weight: bold
    color: black
  .public
    font-weight: 500
  .password
    color: green
    font-weight: 500
  .private
    color: red
    font-weight: 500
</style>
