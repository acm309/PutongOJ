<template lang="html">
  <el-dialog title="Register" :visible.sync="registerDialog" center :before-close="execDialog" :close-on-click-modal="false">
    <el-row>
      <el-col :offset="1" :span="20">
        <el-form :model="regForm" :rules="rules" label-width="120px" ref="loginForm">
          <el-form-item label="uid" prop="uid">
            <el-input v-model="regForm.uid"></el-input>
          </el-form-item>
          <el-form-item label="nick" prop="nick">
            <el-input v-model="regForm.nick"></el-input>
          </el-form-item>
          <el-form-item label="pwd" prop="pwd">
            <el-input v-model="regForm.pwd" type="password"></el-input>
          </el-form-item>
          <el-form-item label="checkPwd" prop="checkPwd">
            <el-input v-model="regForm.checkPwd" type="password"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm('loginForm')">提交</el-button>
            <el-button @click="resetForm('loginForm')">重置</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  props: {
    ifShow: {
      type: Boolean
    }
  },
  data () {
    // 自定义验证规则
    let validatePass1 = (rule, value, callback) => {
      // 6-16位, 数字, 字母, 字符至少包含两种, 同时不能包含中文和空格
      let reg = /[0-9a-zA-Z]{5,20}$/
      if (!reg.test(value)) {
        callback(new Error('密码长度需5-20位，只能包含字母或字符'))
      } else {
        callback()
      }
    }
    // 验证密码是否重复
    let validatePass2 = (rule, value, callback) => {
      if (value !== this.regForm.pwd) {
        callback(new Error('两次密码输入不一致'))
      } else {
        callback()
      }
    }
    return {
      regForm: {
        uid: '',
        nick: '',
        pwd: '',
        checkPwd: ''
      },
      rules: {
        uid: [
          { required: true, message: '用户名不能少', trigger: 'change' },
          { min: 5, max: 20, message: '用户名在5到20位之间', trigger: 'change' }
        ],
        nick: [
          { required: true, message: '昵称不能少', trigger: 'change' }
        ],
        pwd: [
          { required: true, message: '请输入密码', trigger: 'change' },
          { validator: validatePass1, trigger: 'change' }
        ],
        checkPwd: [
          { required: true, message: '请再次输入密码', trigger: 'change' },
          { validator: validatePass2, trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters('user', [
      'registerDialog'
    ])
  },
  methods: {
    ...mapMutations('user', {
      execDialog: 'SHOW_REGISTER'
    }),
    resetForm (formName) {
      this.$refs[formName].resetFields()
    },
    submitForm (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) { // 验证通过
          this.$store.dispatch('user/register', this.regForm).then(data => {
            if (data.success) {
              this.$message({
                type: 'success',
                message: '注册成功',
                duration: 2000,
                showClose: true
              })
            } else {
              this.$message({
                type: 'info',
                message: '用户名已经存在',
                duration: 2000,
                showClose: true
              })
            }
          })
        } else { // 验证不通过
          return false
        }
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
