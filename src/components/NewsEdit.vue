<script setup>
import { storeToRefs } from 'pinia'
import ContentEditor from '@/components/ContentEditor'
import { useNewsStore } from '@/store/modules/news'

const newsStore = useNewsStore()

const { news } = storeToRefs(newsStore)
</script>

<template>
  <div>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Title
      </Col>
      <Col :span="21">
        <Input v-model="news.title" />
      </Col>
    </Row>
    <Row>
      <Col :span="23">
        <ContentEditor
          v-model="news.content"
        />
      </Col>
    </Row>
  </div>
</template>

<style lang="stylus" scoped>
// Some space between title and editor
.ivu-row-flex
  margin-bottom: 20px
.label
  font-size: 16px
  line-height: 32px
</style>
