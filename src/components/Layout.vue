<script setup>
import { useRootStore } from '@/store'
import { storeToRefs } from 'pinia'
import { timePretty, timeDiffPretty } from '@/util/formate'
import { Layout, Footer, Icon } from 'view-ui-plus'
import Header from './Header.vue'
import Dialog from './LoginAndRegister'

const rootStore = useRootStore()
const { currentTime, timeDiff } = $(storeToRefs(rootStore))
const formattedTimeDiff = $computed(() => timeDiffPretty(timeDiff))
const serverTime = $computed(() => isNaN(timeDiff) ? 'Syncing...' :
  `${timePretty(currentTime)} (${formattedTimeDiff})`)
</script>

<script>
export default {
  name: 'OjLayout',
}
</script>

<template>
  <Layout class="app-layout">
    <Header />
    <Content class="layout-content">
      <router-view />
    </Content>
    <Footer class="layout-footer">
      <p>Server Time: {{ serverTime }}</p>
      <p>
        <strong>Putong OJ</strong> by
        <a href="https://github.com/acm309" target="_blank">acm309
          <Icon type="logo-github" />
        </a>.
        <br />
        The source code is under the
        <a href="https://github.com/acm309/PutongOJ/blob/master/LICENSE" target="_blank">
          MIT License</a>.
      </p>
    </Footer>
  </Layout>
  <Dialog />
</template>

<style lang="stylus">
.app-layout
  min-height 100vh
  background #f5f7f9
  position relative
  overflow hidden
.layout-footer
  text-align: center
  background none !important
  p
    margin-bottom: 8px
  .ivu-icon
    vertical-align: -0.06em
.layout-content
  margin 82px 20px 0
  min-height 512px
.layout-content > div
  margin 0 auto
  padding 20px 40px 40px
  border 1px solid #d7dde4
  border-radius 7px
  background #fff
  box-shadow 0 7px 8px -4px rgba(0, 0, 0, .1), 
             0 12px 17px 2px rgba(0, 0, 0, .07), 
             0 5px 22px 4px rgba(0, 0, 0, .06)
@media screen and (max-width: 1024px)
  .layout-content
    margin 72px 10px 0
  .layout-content > div
    padding 10px 20px 20px
@media screen and (max-width: 768px)
  .layout-content
    margin 61px 0 0
  .layout-content > div
    border-radius 0
</style>
