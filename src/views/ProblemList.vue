<template lang="html">
  <div class="prolist-wrap">
    <Row style="margin-bottom: 20px">
      <Col span="16"><Page :total="sum" @on-change="pageChange" :page-size="pageSize" :current.sync="page" show-elevator></Page></Col>
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
        <th>Delete</th>
      </tr>
      <tr v-for="(item, index) in list">
        <td>{{  }}</td>
        <td>{{ item.pid }}</td>
        <td>
          <router-link :to="{ name: 'problemInfo', params: { pid: item.pid } }">
            <Button type="text">{{ item.title }}</Button>
          </router-link>
        <td>
          <span>{{ item.solve / (item.submit + 0.000001) | formate }}</span>&nbsp;
          (<Button type="text">{{ item.solve }}</Button> /
          <Button type="text">{{ item.submit }}</Button>)
        </td>
        <td>
          <template v-for="(item2, index2) in item.tags">
            <Tag>{{ item2 }}</Tag>
          </template>
        </td>
        <td><Button type="text" @click="del(item.pid)">Delete</Button></td>
      </tr>
    </table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import only from 'only'
import { purify } from '@/util/helper'
import api from '@/api'

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
      pageSize: parseInt(this.$route.query.pageSize) || 30
    }
  },
  created () {
    this.fetch()
  },
  computed: {
    ...mapGetters('problem', [
      'list',
      'sum'
    ]),
    query () {
      const opt = only(this.$route.query, 'page pageSize type content')
      return purify(opt)
    }
  },
  methods: {
    fetch () {
      this.$store.dispatch('problem/find', this.query)
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
      console.log(this.content)
    },
    del (val) {
      this.$Modal.confirm({
        title: '提示',
        content: '<p>此操作将永久删除该文件, 是否继续?</p>',
        onOk: () => {
          api.problem.delete({pid: val}).then(() => {
            this.$Message.success('删除成功！')
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
    }
  }
}
</script>

<style lang="stylus">
  .prolist-wrap
    table
      width: 100%
      border-collapse: collapse
      border-spacing: 0
      th:nth-child(1)
        padding-left: 10px
        width: 5%
      th:nth-child(2)
        width: 10%
      th:nth-child(3)
        width: 20%
      th:nth-child(4)
        width: 20%
      th:nth-child(5)
        width: 10%
      th:nth-child(6)
        width: 10%
      tr
        border-bottom: 1px solid #ebeef5
        height: 40px
        line-height: 40px
        font-size: 14px
        td:nth-child(1)
          padding-left: 10px
      th
        text-align:left
      .ivu-btn
        vertical-align: baseline
        color: #e040fb
        padding: 0 1px
        font-size: 14px
</style>
