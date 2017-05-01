const chai = require('chai')
const app = require('../../app')
const supertest = require('supertest')

const request = supertest.agent(app.listen())
const expect = chai.expect

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
  })
})
