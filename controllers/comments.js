const Comment = require('../models/Comment')
const Discuss = require('../models/Discuss')
const Ids = require('../models/ID')
const only = require('only')

async function create (ctx, next) {
  const { did, content } = ctx.request.body
  const cmid = await Ids.generateId('Comment')
  const uid = ctx.session.user.uid
  const comment = new Comment({ did, cmid, content, uid })
  const discuss = await Discuss.findOne({ did }).exec()
  discuss.update = Date.now()
  await Promise.all([ discuss.save(), comment.save() ])
  ctx.body = {
    comment: only(comment, 'cmid did content uid')
  }
}

module.exports = {
  create
}
