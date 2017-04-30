const chai = require('chai')
const User = require('../../models/User')

const expect = chai.expect

describe('User Model', function () {
  describe('#validate', function () {
    it('should error when the fields do not meet the requirements', function (done) {
      expect(User.validate({mail: 'wrong email'}))
        .to.have.property('error')
        .and.not.equal('')

      expect(User.validate({pwd: 'less'}))
        .to.have.property('error')
        .and.not.equal('')

      expect(User.validate({uid: '@123', pwd: '12344555'}))
        .to.have.property('error')
        .and.not.equal('')

      expect(User.validate({uid: '@123', pwd: '12344555'}))
        .to.have.property('valid')
        .to.be.false

      done()
    })

    it('should not error when the fields do meet all requirements', function (done) {
      expect(User.validate({mail: 'true@email.em'}))
        .to.have.property('error')
        .and.equal('')

      expect(User.validate({mail: 'true@email.em', uid: 'admin', pwd: 'this is a good pwd'}))
        .to.have.property('valid')
        .to.be.true

      done()
    })
  })
})
