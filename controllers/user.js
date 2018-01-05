const User = require('../models/User')
const Solution = require('../models/Solution')
const { generatePwd } = require('../utils/helper')

// 查询用户具体信息
const findOne = async (ctx) => {
  const uid = ctx.query.uid
  const [info, solved, unsolved] = await Promise.all([
    User
      .findOne({ uid })
      .select('-_id -pwd')
      .exec(),
    Solution
      .find({ uid, judge: 3 })
      .distinct('pid')
      .exec(),
    Solution
      .find({ uid, judge: {$ne: 3} })
      .distinct('pid')
      .exec()
  ])

  console.log(info)
  ctx.body = {
    info,
    solved,
    unsolved
  }
}

// 注册
const reg = async (ctx) => {
  const user = new User({
    uid: ctx.request.body.uid,
    nick: ctx.request.body.nick,
    pwd: generatePwd(ctx.request.body.pwd)
  })
  // 将objectid转换为用户创建时间(可以不用)
  // user.create = moment(objectIdToTimestamp(user._id)).format('YYYY-MM-DD HH:mm:ss')
  const doc = await User.findOne({ uid: user.uid }).exec()
  if (doc) {
    console.log('用户已经存在')
    ctx.body = {
      success: false
    }
  } else {
    await user.save()

    console.log('注册成功')
    ctx.body = {
      success: true
    }
  }
}

module.exports = {
  findOne,
  reg
}
