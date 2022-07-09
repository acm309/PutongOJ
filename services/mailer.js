require('dotenv-flow').config()

const nodemailer = require('nodemailer')
const config = require('../config')
const Discuss = require('../models/Discuss')
const User = require('../models/User')
const redis = require('../config/redis')
const logger = require('../utils/logger')
require('../config/db')

const transporter = nodemailer.createTransport(config.mail)

async function main () {
  while (true) {
    const res = await redis.brpop('oj:comment', 365 * 24 * 60) // one year 最长等一年(阻塞时间)
    const did = +res[1]
    const discuss = await Discuss.findOne({ did }).exec()
    logger.info(`New comments on ${discuss.did} -- ${discuss.title}`)
    const comments = discuss.comments
    const latest = comments[comments.length - 1]
    const uids = comments.map(x => x.uid)
    const users = await Promise.all(uids.map(uid => User.findOne({ uid }).exec()))
    const emails = [ ...new Set(users.map(x => x.mail).filter(x => x != null || x !== '')) ]
    const mailOptions = {
      from: `"Online Judge" <${config.mail.auth.user}>`,
      to: emails.join(' ,'),
      subject: `New comments on Discuss ${discuss.title}`,
      html: `
        <pre><code>${latest.content}</code></pre>
        by <b>${latest.uid}</b> on ${new Date(latest.create).toLocaleString()}
      `,
    }
    logger.info(`try to sent mails to ${emails}`)
    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error(`${error}`)
          reject(error)
        }
        logger.info('Sent successfully')
        resolve(info)
      })
    })
  }
}

main()
