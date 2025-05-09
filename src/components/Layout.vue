<script setup lang="ts">
import Header from '@/components/Header.vue'
import Dialog from '@/components/LoginAndRegister.vue'
import { useRootStore } from '@/store'
import { timeDiffPretty, timePretty } from '@/util/formate'
import { useHumanLanguage } from '@/util/helper'
import { storeToRefs } from 'pinia'
import { Footer, Icon, Layout, Poptip, Radio, RadioGroup, Space } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const rootStore = useRootStore()
const { website: backend, currentTime, timeDiff } = $(storeToRefs(rootStore))

const serverTime = $computed(() =>
  Number.isNaN(timeDiff)
    ? 'Syncing...'
    : `${timePretty(currentTime)} (${timeDiffPretty(timeDiff)})`)
const frontend = {
  buildSHA: import.meta.env.VITE_BUILD_SHA || 'unknown',
  buildTime: Number.parseInt(import.meta.env.VITE_BUILD_TIME) || Date.now(),
}

let selectedLang = $(useHumanLanguage())
locale.value = selectedLang

function langSelected (lang: string) {
  locale.value = selectedLang = lang
}
</script>

<template>
  <Layout class="app-layout">
    <Header />
    <Content class="layout-content">
      <router-view />
    </Content>
    <Footer class="layout-footer">
      <RadioGroup v-model="selectedLang" type="button" size="small" class="lang-radio-group" @on-change="langSelected">
        <Radio label="zh-CN" class="lang-radio">
          简体中文
        </Radio>
        <Radio label="en-US" class="lang-radio">
          English
        </Radio>
      </RadioGroup>
      <p>Server Time: {{ serverTime }}</p>
      <Poptip trigger="hover">
        <p>
          <strong>Putong OJ</strong> by
          <a href="https://github.com/acm309" target="_blank" class="github-link">
            acm309
            <Icon type="logo-github" class="github-icon" />
          </a>.
          <br>
          The source code is under the
          <a href="https://github.com/acm309/PutongOJ/blob/master/LICENSE" target="_blank" class="license-link">
            MIT License
          </a>.
        </p>
        <template #content>
          <Space direction="vertical">
            <div>
              <div class="component-version">
                <code><b>Putong OJ Backend</b></code>
                <code>#{{ backend.buildSHA }}</code>
              </div>
              <code>Built at {{ timePretty(backend.buildTime) }}</code>
            </div>
            <div>
              <div class="component-version">
                <code><b>Putong OJ Frontend</b></code>
                <code>#{{ frontend.buildSHA }}</code>
              </div>
              <code>Built at {{ timePretty(frontend.buildTime) }}</code>
            </div>
          </Space>
        </template>
      </Poptip>
    </Footer>
  </Layout>
  <Dialog />
</template>

<style lang="stylus">
.app-layout
  min-height 100vh
  position relative
  overflow hidden

.layout-content
  margin 82px 20px 0
  min-height 512px
  & > div
    position relative
    margin 0 auto
    padding 40px
    max-width 1280px
    border 1px solid #d7dde4
    border-radius 7px
    background #fff
    box-shadow 0 7px 8px -4px rgba(0, 0, 0, .1),
               0 12px 17px 2px rgba(0, 0, 0, .07),
               0 5px 22px 4px rgba(0, 0, 0, .06)
  .wrap-loading
    z-index 50
    border-radius 7px

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

  .component-version
    display flex
    justify-content space-between
    width 100%

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
    .wrap-loading
      border-radius 0
</style>
