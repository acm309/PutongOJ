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
      <strong>Putong OJ</strong> by <a href="https://github.com/acm309" target="_blank">acm309
        <Icon type="logo-github" />
      </a>.
      The source code is licensed <a href="https://opensource.org/licenses/mit-license.php" target="_blank">MIT</a>.
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
  border 1px solid #d7dde4
  border-radius 7px
  background #fff
  min-height 500px
  padding 20px 40px
  box-shadow 0 2px 3px hsla(0,0%,4%,.1)
@media screen and (max-width: 768px)
  .layout-content
    margin 72px 10px 0
    padding 10px 20px
</style>
