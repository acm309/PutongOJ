const chai = require('chai')
const app = require('../../app')
const supertest = require('supertest')

const request = supertest.agent(app.listen())
const expect = chai.expect

describe('Status route', function () {
  describe('#get', function () {
    it('should return a required list with specific limit', function (done) {
      request
        .get('/api/status?limit=77')
        .expect(200)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('solutions')
            .to.be.an('array')

          expect(res.body)
            .to.have.property('solutions')
            .to.have.lengthOf(77)
        })
        .end(done)
    })
  })
})
