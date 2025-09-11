import { gcm } from '@noble/ciphers/aes'
import { randomBytes } from '@noble/ciphers/utils'
import { x25519 } from '@noble/curves/ed25519'
import { sha256 } from '@noble/hashes/sha2'

let serverPublicKey: Uint8Array | null = null

function base64Encode (data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
}

function base64Decode (data: string): Uint8Array {
  if (!data) {
    return new Uint8Array()
  }
  return Uint8Array.from(atob(data), c => c.charCodeAt(0))
}

function deriveSharedKey (
  clientSecretKey: Uint8Array,
  serverPublicKey: Uint8Array,
): Uint8Array {
  const sharedSecret = x25519.getSharedSecret(clientSecretKey, serverPublicKey)
  return sha256(sharedSecret)
}

export function setServerPublicKey (base64Key: string) {
  serverPublicKey = base64Decode(base64Key)
}

export async function encryptData (data: string): Promise<string> {
  try {
    if (serverPublicKey == null) {
      throw new Error('Server public key is not set')
    }
    const { secretKey, publicKey } = x25519.keygen()

    const aesKey = deriveSharedKey(secretKey, serverPublicKey)
    const nonce = randomBytes(12)

    const cipher = gcm(aesKey, nonce)
    const plaintext = new TextEncoder().encode(data)
    const ciphertext = cipher.encrypt(plaintext)

    const encryptedData = new Uint8Array(32 + 12 + ciphertext.length)
    encryptedData.set(publicKey, 0)
    encryptedData.set(nonce, 32)
    encryptedData.set(ciphertext, 44)

    return base64Encode(encryptedData)
  } catch (e: any) {
    throw new Error(`Encryption failed: ${e.message}`)
  }
}
