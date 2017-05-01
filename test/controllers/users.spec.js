const chai = require('chai')
const app = require('../../app')
const supertest = require('supertest')

const request = supertest.agent(app.listen())
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
      done()
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
      done()
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
            .not.to.be.empty
        })
      done()
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
            .not.to.be.empty
        })

      request
        .post('/api/users/')
        .field('uid', 'nospace')
        .field('pwd', 'less')
        .field('nick', 'where is the pwd')
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .not.to.be.empty
        })
      done()
    })
  })
})
