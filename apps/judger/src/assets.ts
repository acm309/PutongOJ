import { readFileSync } from 'node:fs'

function readAsset (relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

export const TESTLIB_CODE = readAsset('./assets/testlib.h')
export const DEFAULT_CHECKER_CODE = readAsset('./assets/checkers/lcmp.cpp')
