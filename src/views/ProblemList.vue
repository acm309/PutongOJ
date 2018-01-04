<template lang="html">
  <div class="prolist-wrap">
    <Row style="margin-bottom: 20px">
      <Col span="16"><Page :total="100" show-elevator></Page></Col>
      <Col :span="2">
        <Select v-model="type">
          <Option v-for="item in options" :value="item.value" :key="item.value">{{ item.label }}</Option>
        </Select>
      </Col>
      <Col :span="4">
        <Input v-model="content" icon="search" placeholder="Please input..."></Input>
      </Col>
      <Col :span="2">
        <Button type="primary">Search</Button>
      </Col>
    </Row>
    <Table :columns="table" :data="list"></Table>
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
      table: [
        {
          title: 'PID',
          key: 'pid'
        },
        {
          title: 'Title',
          key: 'title'
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
    del (val) {
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        api.problem.delete({pid: val})
      }).then(() => {
        this.$message({
          type: 'success',
          message: '删除成功!',
          duration: 2000,
          showClose: true
        })
        this.fetch()
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除',
          duration: 2000,
          showClose: true
        })
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
    .pro-main
      margin-bottom: 20px
    .eltable
      margin-bottom: 20px
    .el-table th
      padding: 8px 0
    .el-table td
      padding: 2px 0
    .size
      font-size: 24px
      color: #B12CCC
      cursor: pointer
</style>
