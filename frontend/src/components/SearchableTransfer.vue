<script setup>
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps([ 'source', 'result' ])
const emit = defineEmits([ 'on-search', 'update:result' ])
const searchVal = $ref('')

const { t } = useI18n()

const { source } = $(props)

let targetKeys = $ref([])
let rightSource = $ref([])
let leftSource = $ref(source)

watch($$(source), (val) => {
  leftSource = val
})

function handleChange (newTargetKeys, direction, moveKeys) {
  targetKeys = newTargetKeys
  if (direction === 'left') { // remove
    leftSource = leftSource.concat(moveKeys.map(key => rightSource.find(item => item.key === key)))
    rightSource = rightSource.filter(item => !moveKeys.find(key => item.key === key))
  } else { // add
    rightSource = rightSource.concat(moveKeys.map(key => source.find(item => item.key === key)))
  }
  emit('update:result', targetKeys)
}
</script>

<template>
  <Row type="flex" class="ivu-mb-8">
    <Input v-model="searchVal" type="text" style="width: 20rem" />
    <Button class="ivu-ml-8" type="primary" @click="(v) => emit('on-search', searchVal)">
      {{ t('oj.search') }}
    </Button>
  </Row>
  <Row type="flex" class="transfer">
    <Col span="12" class="transfer-left">
      <Transfer
        filterable
        :data="leftSource"
        :target-keys="targetKeys"
        @on-change="handleChange"
      />
    </Col>
    <Col span="12" class=" transfer-right">
      <Transfer
        filterable
        :data="rightSource"
        :target-keys="targetKeys"
        @on-change="handleChange"
      />
    </Col>
  </Row>
</template>

<style lang="stylus">
.transfer
  .ivu-transfer-list
    width: 80%
    min-height: 30rem
  .transfer-left
    .ivu-transfer-list:nth-child(3)
      display: none
    .ivu-transfer-operation > button:nth-child(1)
      display: none
  .transfer-right
    .ivu-transfer-list:nth-child(1)
        display: none
    .ivu-transfer-operation > .ivu-btn:first-child
      margin-bottom: 0
    .ivu-transfer-operation > button:nth-child(2)
      display: none
.test
  min-height: 100px
  max-height: 50vh
  overflow-y: scroll
  border: 1px solid lightgrey
  border-radius: 0.5em
  padding: 1em
  .test-checkbox
    display: block
    &:not(:last-child)
      margin-bottom: 0.5em
</style>
