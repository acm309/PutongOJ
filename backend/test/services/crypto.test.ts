import test from 'ava'
import cryptoService from '../../src/services/crypto'
import redis from '../../src/config/redis'

test.serial('revokeServerKeyPair', async (t) => {
    await cryptoService.revokeServerKeyPair()
    const value = await redis.get(cryptoService.REDIS_KEY)
    t.is(value, null)
})

test.serial('encryptData (server key not generated)', async (t) => {
    await t.throwsAsync(cryptoService.encryptData('test data'), {
        message: 'Encryption failed: Server key pair not found',
    })
})

test.serial('decryptData (server key not generated)', async (t) => {
    const fakeEncryptedData = 'fakeEncryptedData'
    await t.throwsAsync(cryptoService.decryptData(fakeEncryptedData), {
        message: 'Decryption failed: Server key pair not found',
    })
})

test.serial('getServerPublicKey', async (t) => {
    const publicKey = await cryptoService.getServerPublicKey()
    const value = await redis.get(cryptoService.REDIS_KEY)
    const keyPairInRedis = value ? JSON.parse(value) : null

    t.is(typeof publicKey, 'string')
    t.truthy(keyPairInRedis)
    t.is(publicKey, keyPairInRedis.publicKey)
})

test.serial('encryptData and decryptData', async (t) => {
    const testData = 'This is a test string for encryption'
    const encryptedData = await cryptoService.encryptData(testData)
    t.is(typeof encryptedData, 'string')
    t.not(encryptedData, testData)
    const decryptedData = await cryptoService.decryptData(encryptedData)
    t.is(decryptedData, testData)
})

test.serial('decryptData (invalid data)', async (t) => {
    const invalidData = 'invalidBase64String$$$'
    await t.throwsAsync(cryptoService.decryptData(invalidData), {
        message: 'Decryption failed: Invalid input data',
    })
})
