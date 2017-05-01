const chai = require('chai')
const Contest = require('../../models/Contest')

const expect = chai.expect

describe('Contest Model', function () {
  describe('#validate', function () {
    it('should error when the fields do not meet the requirements', function (done) {
      expect(Contest.validate({
        title: 'wrong emailwrong emailwrong emailwrong emailwrong emailwrong email'
      }))
        .to.have.property('error')
        .and.equal('The length of title should not be more than 50')

      expect(Contest.validate({
        list: [751, 752, 752]
      }))
        .to.have.property('error')
        .and.equal('752 are dulplicated')

      expect(Contest.validate({start: '4000', end: '3000'}))
        .to.have.property('error')
        .and.equal('Start time should not be later than end time')

      expect(Contest.validate({start: '4000', end: '3000'}))
        .to.have.property('valid')
        .to.be.false

      done()
    })

    it('should not error when the fields do meet all requirements', function (done) {
      expect(Contest.validate({title: 'yes contest', list: ['752']}))
        .to.have.property('error')
        .and.equal('')

      expect(Contest.validate({title: 'ok contest', list: ['752']}))
        .to.have.property('valid')
        .to.be.true

      done()
    })
  })
})
