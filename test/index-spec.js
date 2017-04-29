const chai = require('chai')

const expect = chai.expect

describe('Array', function () {
  before(() => {

  })

  after(() => {

  })

  beforeEach(() => {

  })

  afterEach(() => {

  })

  describe('#indexOf', function () {
    it('should return - when the value if not present', function (done) {
      expect([1, 2, 3].indexOf(4)).to.equal(-1)
      done()
    })
  })
})
