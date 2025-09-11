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

const REDIS_KEY = 'crypto:keypair'

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

export async function getServerPublicKey (): Promise<string> {
  let keyPair = await getKeyPairFromRedis()
  if (!keyPair) {
    keyPair = await generateKeyPair()
    await setKeyPairToRedis(keyPair)
  }
  return Buffer.from(keyPair.publicKey).toString('base64')
}

function deriveSharedKey (
  serverSecretKey: Uint8Array,
  clientPublicKey: Uint8Array,
): Uint8Array {
  const sharedSecret = x25519.getSharedSecret(serverSecretKey, clientPublicKey)
  return sha256(sharedSecret)
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
      throw new Error('Invalid encrypted data length')
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
  getServerPublicKey,
  decryptData,
}

export default cryptoService
