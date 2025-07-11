<script setup>
import { Button, Exception } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const home = () => router.push({ name: 'home' })
const back = () => router.go(-1)
</script>

<template>
  <Exception class="exception-box" type="404" desc="Not Found">
    <template #actions>
      <Button type="primary" size="large" @click="home">
        {{ t('oj.go_home') }}
      </Button>
      <Button type="primary" size="large" @click="back">
        {{ t('oj.go_back') }}
      </Button>
    </template>
  </Exception>
</template>

<style lang="stylus" scoped>
.exception-box
  padding 20px
  height 100% !important
  max-width 1024px
@media screen and (max-width: 576px)
  .exception-box
    padding-bottom 100px
</style>
