<template lang="html">
  <el-dialog title="Login" :visible.sync="loginDialog" :before-close="execDialog" center>
    <el-row>
      <el-col :offset="1" :span="20">
        <el-form :model="loginForm" :rules="rules" label-width="120px" ref="loginForm">
          <el-form-item label="uid" prop="uid">
            <el-input v-model="loginForm.uid"></el-input>
          </el-form-item>
          <el-form-item label="pwd" prop="pwd">
            <el-input v-model="loginForm.pwd" type="password"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm('loginForm')">登录</el-button>
            <el-button @click="resetForm('loginForm')">重置</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  props: {
    ifShow: {
      type: Boolean
    }
  },
  data () {
    return {
      loginForm: {
        uid: '',
        pwd: ''
      },
      rules: {
        uid: [
          { required: true, message: '用户名不能少', trigger: 'change' },
          { min: 5, max: 20, message: '用户名在5到20位之间', trigger: 'change' }
        ],
        pwd: [
          { required: true, message: '请输入密码', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters([
      'loginDialog'
    ])
  },
  methods: {
    ...mapMutations({
      execDialog: 'SHOW_LOGIN'
    }),
    ...mapActions([ 'login' ]),
    resetForm (formName) {
      this.$refs[formName].resetFields()
    },
    submitForm (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) { // 验证通过
          const opt = this.loginForm
          this.login(opt).then(() => this.$success('Welcome!'))
        } else {
          // 验证不通过
          return false
        }
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
