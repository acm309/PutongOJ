const Ids = require('../models/ID')

let pid
let cid
let nid
let sid

before(async function () {
  ;[pid, cid, nid, sid] = await Promise.all([
    Ids.findOne({name: 'Problem'}).exec().then((doc) => doc.id),
    Ids.findOne({name: 'Contest'}).exec().then((doc) => doc.id),
    Ids.findOne({name: 'News'}).exec().then((doc) => doc.id),
    Ids.findOne({name: 'Solution'}).exec().then((doc) => doc.id)
  ])
})

after(async function () {
  return Promise.all([
    Ids.findOneAndUpdate({name: 'Problem'}, {$set: {id: pid}}).exec(),
    Ids.findOneAndUpdate({name: 'Contest'}, {$set: {id: cid}}).exec(),
    Ids.findOneAndUpdate({name: 'News'}, {$set: {id: nid}}).exec(),
    Ids.findOneAndUpdate({name: 'Solution'}, {$set: {id: sid}}).exec()
  ])
})
