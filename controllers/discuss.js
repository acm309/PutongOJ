const Discuss = require('../models/Discuss')
const logger = require('../utils/logger')

const preload = async (ctx, next) => {
  const did = parseInt(ctx.params.did)
  if (isNaN(did)) ctx.throw(400, 'Did has to be a number')
  const discuss = await Discuss.findOne({ did }).exec()
  if (discuss == null) ctx.throw(400, 'No such a discuss')
  ctx.state.discuss = discuss
  return next()
}

const find = async (ctx) => {
  const list = await Discuss.find().exec()

  ctx.body = {
    list
  }
}

const findOne = async (ctx) => {
  const discuss = ctx.state.discuss
  ctx.body = {
    discuss
  }
}

const create = async (ctx) => {
  const opt = ctx.request.body
  const discuss = new Discuss({
    title: opt.title,
    uid: ctx.session.profile.uid,
    comments: [{
      uid: ctx.session.profile.uid,
      content: opt.content
    }],
    updated: Date.now()
  })

  try {
    await discuss.save()
    logger.info(`New Discuss is created" ${discuss.pid} -- ${discuss.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    did: discuss.did
  }
}

// 新增评论
const update = async (ctx) => {
  const opt = ctx.request.body
  const discuss = ctx.state.discuss
  try {
    discuss.comments.push({
      uid: ctx.session.profile.uid,
      content: opt.content
    })
    discuss.updated = Date.now()
    await discuss.save()
    logger.info(`One discuss is updated" ${discuss.nid} -- ${discuss.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    did: discuss.did
  }
}

module.exports = {
  preload,
  find,
  findOne,
  create,
  update
}
