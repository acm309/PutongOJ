<template lang="html">
  <article class="media">
    <figure class="media-left">
      <p class="image is-128-128">
        <img src="/dist/avatar.png">
      </p>
    </figure>
    <div class="media-content">
      <nav class="panel">
        <p class="panel-heading">
          {{ user.uid }}
        </p>
        <a class="panel-block is-active">
          <span class="panel-icon">
            <i class="fa fa-heart" aria-hidden="true"></i>
          </span>
          <b>Nick:&nbsp;</b> {{ user.nick }}
        </a>
        <a class="panel-block">
          <span class="panel-icon">
            <i class="fa fa-pencil" aria-hidden="true"></i>
          </span>
          <b>Motto:&nbsp;</b> {{ user.motto }}
        </a>
        <a class="panel-block">
          <span class="panel-icon">
            <i class="fa fa-envelope" aria-hidden="true"></i>
          </span>
          <b>Mail:&nbsp;</b>{{ user.mail }}
        </a>
        <a class="panel-block">
          <span class="panel-icon">
            <i class="fa fa-book" aria-hidden="true"></i>
          </span>
          <b>School:&nbsp;</b>{{ user.school }}
        </a>
        <a class="panel-block">
          <span class="panel-icon">
            <i class="fa fa-check-circle" aria-hidden="true"></i>
          </span>
          <b>Solved:&nbsp;</b> {{ solved.length }}
        </a>
        <a class="panel-block">
          <span class="panel-icon">
            <i class="fa fa-minus-square" aria-hidden="true"></i>
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
export default {
  props: [ 'user', 'solved', 'unsolved' ]
}
</script>

<style lang="css">
</style>
