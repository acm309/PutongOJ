const chai = require('chai')
const app = require('../../app')
const supertest = require('supertest')
const config = require('../config')

const request = supertest.agent(app.callback())
const expect = chai.expect

let cid // the cid of contest which is created and deleted later


describe('Contest route', function () {
  describe('created with visitor', function (done) {
    it('should error when created without login', function (done) {
      request
        .post('/api/contests')
        .send({
          title: 'This is a title',
          start: Date.now(),
          end: Date.now() + 10000
        })
        .expect(400)
        .expect(function ({ body }) {
          expect(body)
            .to.have.property('error')
            .to.match(/login/ig)
        })
        .end(done)
    })
  })

  describe('created by a primary user', function () {
    before((done) => {
      request
        .post('/api/session')
        .send({
          uid: config.PU.uid,
          pwd: config.PU.pwd
        })
        .end(done)
    })

    it('should error when created by a primary user', function (done) {
      request
        .post('/api/contests')
        .send({
          title: 'This is a title',
          start: Date.now(),
          end: Date.now() + 10000
        })
        .expect(400)
        .expect(function ({ body }) {
          expect(body)
            .to.have.property('error')
            .to.match(/allowed/ig)
        })
        .end(done)
    })
  })

})
