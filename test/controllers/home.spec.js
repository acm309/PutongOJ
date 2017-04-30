const chai = require('chai')
const app = require('../../app')
const supertest = require('supertest')

const request = supertest.agent(app.listen())
const expect = chai.expect

describe('Home route', function () {
  describe('#servertime', function () {
    it('should return a object with servertime representing the time stamp', function (done) {
      request
        .get('/api/')
        .expect(200)
        .expect(function (res) {
          expect(res.body)
            .to.have.property('servertime')
            .to.be.a('number')
        })
      done()
    })
  })
})
