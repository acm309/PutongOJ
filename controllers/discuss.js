const Discuss = require('../models/Discuss')
const logger = require('../utils/logger')
const redis = require('../config/redis')

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
    list,
  }
}

const findOne = async (ctx) => {
  const discuss = ctx.state.discuss
  ctx.body = {
    discuss,
  }
}

const create = async (ctx) => {
  const opt = ctx.request.body
  const discuss = new Discuss({
    title: opt.title,
    uid: ctx.session.profile.uid,
    comments: [ {
      uid: ctx.session.profile.uid,
      content: opt.content,
    } ],
    update: Date.now(),
  })

  try {
    await discuss.save()
    logger.info(`New Discuss is created" ${discuss.did} -- ${discuss.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    did: discuss.did,
  }
}

// 新增评论
const update = async (ctx) => {
  const opt = ctx.request.body
  const discuss = ctx.state.discuss
  try {
    discuss.comments.push({
      uid: ctx.session.profile.uid,
      content: opt.content,
    })
    discuss.update = Date.now()
    await discuss.save()
    redis.lpush('oj:comment', discuss.did)
    logger.info(`One discuss is updated" ${discuss.did} -- ${discuss.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    did: discuss.did,
  }
}

const del = async (ctx) => {
  const did = ctx.params.did

  try {
    await Discuss.deleteOne({ did }).exec()
    logger.info(`One Discuss is delete ${did}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

module.exports = {
  preload,
  find,
  findOne,
  create,
  update,
  del,
}
