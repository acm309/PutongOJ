import { Buffer } from 'node:buffer'
import { gcm } from '@noble/ciphers/aes'
import { x25519 } from '@noble/curves/ed25519'
import { sha256 } from '@noble/hashes/sha2'
import redis from '../config/redis'

export interface KeyPair {
  publicKey: Uint8Array
  secretKey: Uint8Array
  generatedAt: number
}

export const REDIS_KEY = 'crypto:keypair'

async function generateKeyPair (): Promise<KeyPair> {
  const { secretKey, publicKey } = x25519.keygen()
  const keyPair: KeyPair = {
    publicKey,
    secretKey,
    generatedAt: Date.now(),
  }
  return keyPair
}

async function setKeyPairToRedis (keyPair: KeyPair): Promise<void> {
  const { publicKey, secretKey, generatedAt } = keyPair
  const value = JSON.stringify({
    publicKey: Buffer.from(publicKey).toString('base64'),
    secretKey: Buffer.from(secretKey).toString('base64'),
    generatedAt,
  })
  await redis.set(REDIS_KEY, value)
}

async function getKeyPairFromRedis (): Promise<KeyPair | null> {
  const value = await redis.get(REDIS_KEY)
  if (!value) {
    return null
  }

  const { publicKey, secretKey, generatedAt } = JSON.parse(value)
  const keyPair: KeyPair = {
    publicKey: Buffer.from(publicKey, 'base64'),
    secretKey: Buffer.from(secretKey, 'base64'),
    generatedAt,
  }
  return keyPair
}

async function clearKeyPairFromRedis (): Promise<void> {
  await redis.del(REDIS_KEY)
}

export async function getServerPublicKey (): Promise<string> {
  let keyPair = await getKeyPairFromRedis()
  if (!keyPair) {
    keyPair = await generateKeyPair()
    await setKeyPairToRedis(keyPair)
  }
  return Buffer.from(keyPair.publicKey).toString('base64')
}

export async function revokeServerKeyPair (): Promise<void> {
  await clearKeyPairFromRedis()
}

function deriveSharedKey (
  serverSecretKey: Uint8Array,
  clientPublicKey: Uint8Array,
): Uint8Array {
  const sharedSecret = x25519.getSharedSecret(serverSecretKey, clientPublicKey)
  return sha256(sharedSecret)
}

export async function encryptData (data: string): Promise<string> {
  try {
    if (!data) {
      throw new Error('Input data is empty')
    }

    const serverPublicKeyBase64 = await getServerPublicKey()
    const serverPublicKey = Buffer.from(serverPublicKeyBase64, 'base64')
    const { secretKey, publicKey } = x25519.keygen()

    const aesKey = deriveSharedKey(secretKey, serverPublicKey)
    const nonce = crypto.getRandomValues(new Uint8Array(12))

    const cipher = gcm(aesKey, nonce)
    const plaintext = new TextEncoder().encode(data)
    const ciphertext = cipher.encrypt(plaintext)

    const encryptedData = new Uint8Array(32 + 12 + ciphertext.length)
    encryptedData.set(publicKey, 0)
    encryptedData.set(nonce, 32)
    encryptedData.set(ciphertext, 44)

    return Buffer.from(encryptedData).toString('base64')
  } catch (e: any) {
    throw new Error(`Encryption failed: ${e.message}`)
  }
}

export async function decryptData (
  encryptedDataBase64: string,
): Promise<string> {
  try {
    const serverKeyPair = await getKeyPairFromRedis()
    if (!serverKeyPair) {
      throw new Error('Server key pair not found')
    }

    const encryptedData = Buffer.from(encryptedDataBase64, 'base64')
    if (encryptedData.length < 44) {
      throw new Error('Invalid input data')
    }

    const { secretKey } = serverKeyPair

    const clientPublicKey = encryptedData.subarray(0, 32)
    const nonce = encryptedData.subarray(32, 44)
    const ciphertext = encryptedData.subarray(44)

    const aesKey = deriveSharedKey(secretKey, clientPublicKey)
    const cipher = gcm(aesKey, nonce)
    const plaintext = cipher.decrypt(ciphertext)

    return new TextDecoder().decode(plaintext)
  } catch (e: any) {
    throw new Error(`Decryption failed: ${e.message}`)
  }
}

const cryptoService = {
  REDIS_KEY,
  getServerPublicKey,
  revokeServerKeyPair,
  encryptData,
  decryptData,
}

export default module.exports = cryptoService
