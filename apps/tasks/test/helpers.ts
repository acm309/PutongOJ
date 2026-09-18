import process from 'node:process'
import test from 'ava'
import { SandboxClient } from '../src/sandbox/client.ts'

export const integrationTest = process.env.PTOJ_RUN_INTEGRATION === '1'
  ? test
  : test.skip

export const sandboxEndpoint
  = process.env.PTOJ_SANDBOX_ENDPOINT?.trim() || 'http://127.0.0.1:5050'

export const mongodbURL
  = process.env.PTOJ_MONGODB_URL?.trim() || 'mongodb://127.0.0.1:27017/putong-tasks-test'

export function createClient (): SandboxClient {
  return new SandboxClient(sandboxEndpoint)
}
