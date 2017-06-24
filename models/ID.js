const mongoose = require('mongoose')

const IdSchema = mongoose.Schema({
  id: Number, // 这里的 id 只对应集合中最大的 id 值
  name: {
    type: String,
    index: {
      unique: true
    }
  }
}, {
  collection: 'ids'
})

/**
  Return a new id for required field
  @param {String} [field=''] - the required field
  @returns {Number} - a new id
  @example
    Before:
      ids collection in db:
        { "id" : 1, "name" : "News" }
    After:
      // return 2
      ids.generateId('News')
      ids collection in db:
        { "id" : 2, "name" : "News" }

*/
IdSchema.statics.generateId = function (field = '') {
  field = field.toLocaleLowerCase()
  field = field[0].toLocaleUpperCase() + field.slice(1)
  return this
    .findOneAndUpdate({name: field}, {$inc: {id: 1}})
    .exec()
    .then((obj) => obj.id + 1) // 记得取 id 字段加 1 才是新的可用的 id
}

module.exports = mongoose.model('Ids', IdSchema)
