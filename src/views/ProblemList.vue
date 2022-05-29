<template>
  <div class="prolist-wrap">
    <Row style="margin-bottom: 20px">
      <Col span="16">
        <Page :total="sum" @on-change="pageChange" :page-size="pageSize" :current.sync="page" show-elevator></Page>
      </Col>
      <Col :span="2">
        <Select v-model="type">
          <Option v-for="item in options" :value="item.value" :key="item.value">{{ item.label }}</Option>
        </Select>
      </Col>
      <Col :span="4">
        <Input v-model="content" icon="search" placeholder="Please input..." @keyup.enter.native="search"></Input>
      </Col>
      <Col :span="2">
        <Button type="primary" @click="search">Search</Button>
      </Col>
    </Row>
    <table>
      <tr>
        <th>#</th>
        <th>PID</th>
        <th>Title</th>
        <th>Ratio</th>
        <th>Tags</th>
        <th v-if="isAdmin">Visible</th>
        <th v-if="isAdmin && canRemove">Delete</th>
      </tr>
      <template v-for="item in list">
        <tr v-if="isAdmin || item.status === status.Available" :key="item.pid">
          <td>
            <Icon v-if="solved.indexOf(item.pid) !== -1" type="checkmark-round"></Icon>
          </td>
          <td>{{ item.pid }}</td>
          <td>
            <router-link :to="{ name: 'problemInfo', params: { pid: item.pid } }">
              <Button type="text">{{ item.title }}</Button>
            </router-link>
            <Tooltip content="This item is reserved, no one could see this, except admin" placement="right">
              <strong v-show="item.status === status.Reserve">Reserved</strong>
            </Tooltip>
          <td>
            <span>{{ item.solve / (item.submit + 0.000001) | formate }}</span>&nbsp;
            (<router-link :to="{ name: 'status', query: { pid: item.pid, judge: judge.Accepted } }">
              <Button type="text">{{ item.solve }}</Button>
            </router-link> /
            <router-link :to="{ name: 'status', query: { pid: item.pid } }">
              <Button type="text">{{ item.submit }}</Button>
            </router-link>)
          </td>
          <td>
            <template v-for="(item2, index2) in item.tags">
              <router-link :to="{ name: 'problemList', query: { type: 'tag', content: item2 } }" :key="index2">
                <Tag>{{ item2 }}</Tag>
              </router-link>
            </template>
          </td>
          <td v-if="isAdmin">
            <Tooltip content="Click to change status" placement="right">
              <Button type="text" @click="change(item)">{{ problemVisible[item.status] }}</Button>
            </Tooltip>
          </td>
          <td v-if="isAdmin && canRemove">
            <Button type="text" @click="del(item.pid)">Delete</Button>
          </td>
        </tr>
      </template>
    </table>
  </div>
</template>
<script>
import only from 'only'
import { purify } from '@/util/helper'
import constant from '@/util/constant'
import { useSessionStore } from '@/store/modules/session'
import { useProblemStore } from '@/store/modules/problem'
import { useRootStore } from '@/store'
import { mapActions, mapState } from 'pinia'

export default {
  data () {
    return {
      options: [
        {
          value: 'pid',
          label: 'Pid'
        },
        {
          value: 'title',
          label: 'Title'
        },
        {
          value: 'tag',
          label: 'Tag'
        }
      ],
      type: this.$route.query.type || 'pid',
      content: this.$route.query.content || '',
      page: parseInt(this.$route.query.page) || 1,
      pageSize: parseInt(this.$route.query.pageSize) || 30,
      problemVisible: constant.status
    }
  },
  created () {
    this.fetch()
  },
  computed: {
    ...mapState(useProblemStore, ['list', 'sum', 'solved']),
    ...mapState(useRootStore, ['status', 'judge']),
    ...mapState(useSessionStore, ['isAdmin', 'canRemove', 'profile']),
    query () {
      return only(this.$route.query, 'page pageSize type content')
    }
  },
  methods: {
    ...mapActions(useProblemStore, ['find', 'update']),
    ...mapActions(useProblemStore, {'remove': 'delete'}),
    fetch () {
      this.find(this.query)
      const query = this.$route.query
      this.page = parseInt(query.page) || 1
      if (query.pageSize) this.pageSize = parseInt(query.pageSize)
      if (query.type) this.type = query.type
      if (query.content) this.content = query.content
    },
    reload (payload = {}) {
      const query = Object.assign(this.query, purify(payload))
      this.$router.push({
        name: 'problemList',
        query
      })
    },
    search () {
      this.reload({
        page: 1,
        type: this.type,
        content: this.content
      })
    },
    sizeChange (val) {
      this.reload({ pageSize: val })
    },
    pageChange (val) {
      this.reload({ page: val })
    },
    clear () {
      this.content = ''
    },
    change (problem) {
      problem.status = problem.status === this.status.Reserve
        ? this.status.Available
        : this.status.Reserve
      this.update(problem).then(() => {
        this.find(this.query)
      })
    },
    del (pid) {
      this.$Modal.confirm({
        title: '提示',
        content: '<p>此操作将永久删除该文件, 是否继续?</p>',
        onOk: () => {
          this.remove({ pid }).then(() => {
            this.$Message.success(`成功删除 ${pid}！`)
          })
        },
        onCancel: () => {
          this.$Message.info('已取消删除！')
        }
      })
    }
  },
  watch: { // 浏览器后退时回退页面
    '$route' (to, from) {
      if (to !== from) this.fetch()
    },
    'profile' (val) {
      this.find(this.query)
    }
  }
}
</script>
<style lang="stylus" scoped>
@import '../styles/common'

table
  th:nth-child(1)
    width: 5%
  th:nth-child(2)
    width: 10%
  th:nth-child(3)
    width: 20%
  th:nth-child(4)
    width: 20%
  th:nth-child(5)
    width: 20%
  th:nth-child(6)
    width: 10%
  th:nth-child(7)
    width: 10%
</style>
