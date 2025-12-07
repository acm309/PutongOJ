<script setup lang="ts">
import AuthnDialog from '@/components/AuthnDialog.vue'
import Header from '@/components/Header.vue'
import Footer from './Footer.vue'
</script>

<template>
  <div class="bg-emphasis flex flex-col font-sans min-h-screen relative text-color">
    <Header />
    <RouterView name="extraHeader" />
    <div class="flex-auto lg:pt-4 lg:px-4 md:pt-2 md:px-2 min-h-[512px]">
      <RouterView
        class="bg-(--p-content-background) border border-surface layout-content md:rounded-xl mx-auto shadow-lg"
      />
    </div>
    <Footer />
  </div>
  <AuthnDialog />
</template>

<style lang="stylus">
.layout-content
  position relative
  padding 40px
  max-width 1280px

.wrap-loading
  z-index 40
.wrap-loading, .modal-loading
  border-radius 7px

@media screen and (max-width 1024px)
  .layout-content
    padding 10px 20px 20px

@media screen and (max-width 768px)
  .wrap-loading
    border-radius 0
</style>
