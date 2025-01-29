<script setup>
import { useRootStore } from '@/store'
import { storeToRefs } from 'pinia'
import { timePretty, timeDiffPretty } from '@/util/formate'
import { Layout, Footer, Icon } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import { useHumanLanguage } from '@/util/helper'
import Header from './Header.vue'
import Dialog from './LoginAndRegister'
import { RadioGroup, Radio } from 'view-ui-plus'

const rootStore = useRootStore()
const { currentTime, timeDiff } = $(storeToRefs(rootStore))
const formattedTimeDiff = $computed(() => timeDiffPretty(timeDiff))
const serverTime = $computed(() => isNaN(timeDiff) ? 'Syncing...' : `${timePretty(currentTime)} (${formattedTimeDiff})`)

const { locale } = useI18n()
let selectedLang = $(useHumanLanguage())
locale.value = selectedLang

function langSelected(lang) {
  locale.value = selectedLang = lang
}
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
      <RadioGroup v-model="selectedLang" type="button" size="small" @on-change="langSelected" class="lang-radio-group">
        <Radio label="zh-CN" class="lang-radio">简体中文</Radio>
        <Radio label="en-US" class="lang-radio">English</Radio>
      </RadioGroup>
      <p>Server Time: {{ serverTime }}</p>
      <p>
        <strong>Putong OJ</strong> by
        <a href="https://github.com/acm309" target="_blank" class="github-link">
          acm309
          <Icon type="logo-github" class="github-icon" />
        </a>.
        <br />
        The source code is under the
        <a href="https://github.com/acm309/PutongOJ/blob/master/LICENSE" target="_blank" class="license-link">
          MIT License</a>.
      </p>
    </Footer>
  </Layout>
  <Dialog />
</template>

<style lang="stylus">
html
  background #f5f7f9

.app-layout
  min-height 100vh
  position relative
  overflow hidden

.layout-content
  margin 82px 20px 0
  min-height 512px
  & > div
    margin 0 auto
    padding 40px
    max-width 1280px
    border 1px solid #d7dde4
    border-radius 7px
    background #fff
    box-shadow 0 7px 8px -4px rgba(0, 0, 0, .1), 
               0 12px 17px 2px rgba(0, 0, 0, .07), 
               0 5px 22px 4px rgba(0, 0, 0, .06)

.layout-footer
  text-align center
  background none !important
  padding-top 42px !important
  p
    margin-bottom 16px

  .lang-radio-group
    margin-bottom 4px
    .lang-radio
      background none

  .github-link
    text-decoration none
    &:hover
      text-decoration underline
  .github-icon
    vertical-align -0.06em
  .license-link
    text-decoration none
    &:hover
      text-decoration underline

@media screen and (max-width 1024px)
  .layout-content
    margin 72px 10px 0
    & > div
      padding 10px 20px 20px

@media screen and (max-width 768px)
  .layout-content
    margin 61px 0 0
    & > div
      border-radius 0
</style>
