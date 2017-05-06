<template lang="html">
  <article class="media">
    <figure class="media-left">
      <p class="image is-128-128">
        <img src="http://bulma.io/images/placeholders/128x128.png">
      </p>
    </figure>
    <div class="media-content">
      <nav class="panel">
        <p class="panel-heading">
          {{ user.uid }}
        </p>
        <a class="panel-block is-active">
          <span class="panel-icon">
            <i class="fa fa-book"></i>
          </span>
          <b>Nick:&nbsp;</b> {{ user.nick }}
        </a>
        <a class="panel-block">
          <span class="panel-icon">
            <i class="fa fa-book"></i>
          </span>
          <b>Motto:&nbsp;</b> {{ user.motto }}
        </a>
        <a class="panel-block">
          <span class="panel-icon">
            <i class="fa fa-book"></i>
          </span>
          <b>Mail:&nbsp;</b>{{ user.mail }}
        </a>
        <a class="panel-block">
          <span class="panel-icon">
            <i class="fa fa-book"></i>
          </span>
          <b>School:&nbsp;</b>{{ user.school }}
        </a>
        <a class="panel-block">
          <span class="panel-icon">
            <i class="fa fa-code-fork"></i>
          </span>
          <b>Solved:&nbsp;</b> {{ solved.length }}
        </a>
        <a class="panel-block">
          <span class="panel-icon">
            <i class="fa fa-code-fork"></i>
          </span>
          <b>Unsolved:&nbsp;</b> {{ unsolved.length }}
        </a>
      </nav>
      <article class="message">
        <div class="message-header">
          <p>Solved</p>
        </div>
        <div class="message-body">
          <span
            v-for="pid in solved"
            :key="pid"
          >
            <router-link
              :to="{name: 'problem', params: { pid }}"
            >{{ pid }}</router-link> {{ ' ' }}
          </span>
        </div>
      </article>
      <article class="message">
        <div class="message-header">
          <p>Unsolved</p>
        </div>
        <div class="message-body">
          <span
            v-for="pid in unsolved"
          >
            <router-link
              :to="{name: 'problem', params: { pid }}"
            >{{ pid }}</router-link> {{ ' ' }}
          </span>
        </div>
      </article>
      <article class="message">
        <div class="message-header">
          <p>Login</p>
        </div>
        <div class="message-body">
          <p
            v-for="(ip, index) in user.iprecord"
            v-if="ip"
          >
            {{ ip }} -- {{ user.timerecord[index] | timePretty }}
          </p>
        </div>
      </article>
    </div>
  </article>
</template>

<script>
// TODO 换默认头像
export default {
  props: [ 'user', 'solved', 'unsolved' ]
}
</script>

<style lang="css">
</style>
