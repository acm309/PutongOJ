const zipFolder = require('zip-folder')
const { resolve } = require('path')

zipFolder(resolve(__dirname, '../dist'), resolve(__dirname, '../dist.zip'), function (err) {
  if (err) {
    console.log('oh no!', err)
  } else {
    console.log('EXCELLENT')
  }
})
