const Comment = require('../models/Comment')
const Ids = require('../models/ID')
const only = require('only')

async function create (ctx, next) {
  const { did, content } = ctx.request.body
  const cmid = await Ids.generateId('Comment')
  const uid = ctx.session.user.uid
  const comment = new Comment({ did, cmid, content, uid })
  await comment.save()
  ctx.body = {
    comment: only(comment, 'cmid did content uid')
  }
}

module.exports = {
  create
}
