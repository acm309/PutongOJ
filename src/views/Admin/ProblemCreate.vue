<template>
  <div>
    <h1>出题的基本步骤</h1>
    <br>
    <Steps :current="5" :style="{ color: 'black'}">
      <Step title="算法设计" content="思考该题希望解答者使用的算法类型" status="process"></Step>
      <Step title="题面设计" content="在算法基础上增加适当背景描述" status="process"></Step>
      <Step title="输入输出格式" content="一般情况下应该使输入输出保持简单" status="process"></Step>
      <Step title="测试数据编写" content="尽可能多出一点数据，这些数据建议自己写代码生成" status="process"></Step>
      <Step title="测试题目" content="务必自己写代码测试题目能不能通过！！！必要时也要让其它人测试题目" icon="ios-star" status="process"></Step>
    </Steps>
    <br>
    <oj-problem-edit
      :problem="problem"
    />
    <Button type="primary" size="large" @click="submit">Submit</Button>
  </div>
</template>
<script>
import ProblemEdit from '@/components/ProblemEdit'
import { useProblemStore } from '@/store/modules/problem'
import { mapActions } from 'pinia'

export default {
  components: {
    'oj-problem-edit': ProblemEdit
  },
  data: () => ({
    problem: {
      title: '',
      memory: 32268,
      time: 1000,
      description: '',
      input: '',
      output: '',
      hint: '',
      in: '',
      out: ''
    }
  }),
  methods: {
    ...mapActions(useProblemStore, ['create']),
    submit () {
      if (!this.problem.title.trim()) {
        this.$Message.error('Title can not be empty')
      } else if (!this.problem.description.trim()) {
        this.$Message.error('Description can not be empty')
      } else {
        this
          .create(this.problem)
          .then((pid) => {
            this.$Message.success(`Problem "${this.problem.title}" has been created!`)
            this.$router.push({ name: 'problemInfo', params: { pid } })
          })
      }
    }
  }
}
</script>
<style>
</style>
