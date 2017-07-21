const Discuss = require('../models/Discuss')
const Comment = require('../models/Comment')
const only = require('only')
const Ids = require('../models/ID')

async function queryList (ctx, next) {
  const discusses = await Discuss
    .find()
    .select('-_id did title create update uid')
    .exec()

  ctx.body = { discusses }
}
// titile uid content
async function create (ctx, next) {
  const did = await Ids.generateId('Discuss')
  const cmid = await Ids.generateId('Comment')
  const uid = ctx.session.user.uid
  const discuss = new Discuss({
    did,
    title: ctx.request.body.title,
    uid: ctx.session.user.uid
  })

  const comment = new Comment({
    cmid,
    did,
    content: ctx.request.body.content,
    uid
    // uid: ctx.session.uid
  })

  await Promise.all([
    discuss.save(),
    comment.save()
  ])

  ctx.body = {
    discuss: only(discuss, 'did title create update create uid')
  }
}

async function queryOneDiscuss (ctx, next) {
  const did = +ctx.params.did
  const discuss = await Discuss
    .findOne({did})
    .select('-_id did title create')
  const comments = await Comment
    .find({did})
    .select('-_id cmid did uid content create')
    .sort({ create: 1 })
    .exec()
  ctx.body = {
    discuss,
    comments
  }
}

module.exports = {
  queryList,
  create,
  queryOneDiscuss
}
