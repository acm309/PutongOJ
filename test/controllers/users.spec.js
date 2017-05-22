const chai = require('chai')
const app = require('../../app')
const request = require('supertest').agent(app.callback())
const config = require('../config')

const expect = chai.expect

describe('User route', function () {
  describe('#users get (query one user)', function () {
    it('should error when a uid does not exist', function (done) {
      request
        .get('/api/users/965055be74b37f9b9')
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .to.equal('No such a user')
        })
        .end(done)
    })

    it('should return the user when query an existed user', function (done) {
      request
        .get('/api/users/admin')
        .expect(200)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('user')
            .to.be.an('object')

          expect(res.body)
            .to.have.property('solved')
            .to.be.an('array')

          expect(res.body)
            .to.have.property('unsolved')
            .to.be.an('array')
        })
        .end(done)
    })
  })

  describe('#users post (register one user)', function () {
    it('should error when one required field not provided', function (done) {
      request
        .post('/api/users/')
        .field('uid', 'noPwdProvided')
        .field('nick', 'where is the pwd')
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .to.match(/uid/ig)
        })
        .end(done)
    })

    it('should error when one field does not meet the basic requirements', function (done) {
      request
        .post('/api/users/')
        .field('uid', 'no space')
        .field('pwd', 'thisisabasicpwd')
        .field('nick', 'where is the pwd')
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .to.match(/uid/ig)
        })

      request
        .post('/api/users/')
        .send({
          uid: 'nospace',
          pwd: 'less',
          nick: 'where is the pwd'
        })
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .to.match(/length/ig)
        })
        .end(done)
    })
  })

  describe('#users (put) by visitor', function () {
    it('should error without login', function (done) {
      request
        .put('/api/users/admin')
        .send({ uid: 'admin', pwd: 'no password', nick: 'admin' })
        .expect(400)
        .expect(function ({body}) {
          expect(body)
            .to.have.property('error')
            .to.match(/login/ig)
        })
        .end(done)
    })
  })

  describe('#users (put) by a primary user', function () {
    before((done) => {
      request
        .post('/api/session')
        .send({
          uid: config.PU.uid,
          pwd: config.PU.pwd
        })
        .expect(200)
        .end(done)
    })

    after((done) => {
      request
        .del('/api/session')
        .expect(200)
        .end(done)
    })

    it('should error when one (except admin) update info of others', function (done) {
      request
        .put('/api/users/admin')
        .send({
          uid: 'admin',
          pwd: 'new pwd'
        })
        .expect(400)
        .expect(function ({body}) {
          expect(body)
            .to.have.property('error')
            .to.match(/allowed/ig)
        })
        .end(done)
    })

    it('should success when one update his/her own profile', function (done) {
      const r = Math.random()
      request
        .put(`/api/users/${config.PU.uid}`)
        .send({
          motto: r
        })
        .expect(200)
        .expect(function ({body}) {
          expect(body)
            .to.have.property('user')
            .to.have.property('motto')
            .to.eql('' + r)
        })
        .end(done)
    })
  })

  describe('#user (put) by admin', function () {
    before((done) => {
      request
        .post('/api/session')
        .send({
          uid: config.Admin.uid,
          pwd: config.Admin.pwd
        })
        .expect(200)
        .end(done)
    })

    it('should success when admin update profile of other users', function (done) {
      const r = Math.random()
      request
        .put(`/api/users/${config.PU.uid}`)
        .send({
          motto: r
        })
        .expect(200)
        .expect(function ({ body }) {
          expect(body)
            .to.have.property('user')
            .to.have.property('motto')
            .to.eql('' + r)
        })
        .end(done)
    })

    after((done) => {
      request
        .del('/api/session')
        .expect(200)
        .end(done)
    })
  })
})
