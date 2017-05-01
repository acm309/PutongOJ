const chai = require('chai')
const app = require('../../app')
const supertest = require('supertest')

const request = supertest.agent(app.listen())
const expect = chai.expect

describe('Statistics route', function () {
  describe('#get', function () {
    it('should error when request an unexisted problem', function (done) {
      request
        .get('/api/statistics/199')
        .expect(400)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('error')
            .to.equal('No such a problem')
        })
        .end(done)
    })

    it('should return a required object when request an existed problem', function (done) {
      request
        .get('/api/statistics/751')
        .expect(200)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('solutions')
            .to.be.an('array')

          expect(res.body)
            .to.have.property('statistics')
            .to.be.an('object')

          // 3 represents 'Accepted'

          expect(res.body.statistics[3])
            .to.be.a('number')
        })
        .end(done)
    })
  })
})
