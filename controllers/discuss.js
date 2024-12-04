const Discuss = require('../models/Discuss')
const logger = require('../utils/logger')
const redis = require('../config/redis')
const { isLogined, isAdmin } = require('../utils/helper')

const preload = async (ctx, next) => {
  const did = Number.parseInt(ctx.params.did)
  if (Number.isNaN(did)) { ctx.throw(400, 'Did has to be a number') }
  const discuss = await Discuss.findOne({ did }).exec()
  if (discuss == null) { ctx.throw(400, 'No such a discuss') }
  ctx.state.discuss = discuss
  return next()
}

const find = async (ctx) => {
  if (!isLogined(ctx)) {
    ctx.body = { list: [] }
    return
  }

  let list
  if (isAdmin(ctx.session.profile)) {
    list = await Discuss.find().exec()
  } else {
    list = await Discuss.find({ uid: ctx.session.profile.uid }).exec()
  }

  ctx.body = {
    list,
  }
}

const findOne = async (ctx) => {
  const discuss = ctx.state.discuss

  if (discuss.uid !== ctx.session.profile.uid && !isAdmin(ctx.session.profile)) {
    ctx.throw(400, 'You do not have permission to enter this discuss!')
  }

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

  if (discuss.uid !== ctx.session.profile.uid && !isAdmin(ctx.session.profile)) {
    ctx.throw(400, 'You do not have permission to reply this discuss!')
  }

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
