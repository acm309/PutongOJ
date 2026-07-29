import mitt from 'mitt'

const emitter = mitt<{
  'submission-updated': number
}>()

export default emitter
