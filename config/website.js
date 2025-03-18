const process = require('node:process')

module.exports = {
  title: process.env.title || 'Putong OJ',
  discussOnProblem: (process.env.discussOnProblem || 'false').toLocaleLowerCase() === 'true',
  semi_restful: false,
}
