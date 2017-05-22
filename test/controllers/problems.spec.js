const chai = require('chai')
const app = require('../../app')
const supertest = require('supertest')

const request = supertest.agent(app.callback())
const expect = chai.expect

let pid // created and then deleted

before(function (done) {
  request.post('/api/session')
    .send({
      uid: 'admin',
      pwd: 'kplkplkpl'
    })
    .expect(200)
    .expect(function (res) {
      expect(res.body)
        .to.have.property('user')
        .to.be.an('object')
    })
    .end(done)
})

describe('Problem route', function () {
  describe('#get', function () {
    it('should return a list with specific limit', function (done) {
      request
        .get('/api/problems?limit=27')
        .expect(200)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('problems')
            .to.be.a('array')
          expect(res.body)
            .to.have.property('problems')
            .to.have.lengthOf(27)
        })
        .end(done)
    })

    it('should error since there is no such a problem', function (done) {
      request
        .get('/api/problems/12')
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .to.be.a('string')
          expect(res.body)
            .to.have.property('error')
            .to.equal('No such a problem')
        })
        .end(done)
    })
  })

  describe('#post', function () {
    it('should error if title is empty', function (done) {
      request
        .post('/api/problems')
        .send({ title: '' })
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .to.match(/title/ig)
        })
        .end(done)
    })

    it('should error if time is too large', function (done) {
      request
        .post('/api/problems')
        .send({ title: 'title', time: 10000 + 1000, memory: 32768 })
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .to.match(/time/ig)
        })
        .end(done)
    })

    it('should error if memory is too large', function (done) {
      request
        .post('/api/problems')
        .send({title: 'title', time: 1000, memory: 32768 * 5})
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .to.match(/memory/ig)
        })
        .end(done)
    })

    it('should successfully created', function (done) {
      request
        .post('/api/problems')
        .send({title: 'new test', time: 1000, memory: 32678, input: '123', output: '345'})
        .expect(200)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('problem')
            .that.contain.all.keys('pid', 'title', 'memory', 'description', 'input', 'output',
          'in', 'out')
          pid = +res.body.problem.pid
        })
        .end(done)
    })
  })

  describe('#put', function () {
    it('should successfully update', function (done) {
      request
        .put('/api/problems/' + pid)
        .send({title: 'a new title'})
        .expect(200)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('problem')
            .to.have.property('title', 'a new title')
        })
        .end(done)
    })
  })

  describe('#delete', function () {
    it('should successfully delete a created problem', function (done) {
      request
        .del('/api/problems/' + pid)
        .expect(200)
        .end(done)
    })

    it('should error when deleting an unexisted problem', function (done) {
      request
        .del('/api/problems/' + pid)
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .to.match(/problem/ig)
        })
        .end(done)
    })
  })
})
