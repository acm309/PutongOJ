import { fileTypeFromFile } from 'file-type'

export async function detectContentType (filepath: string): Promise<string> {
  try {
    return (await fileTypeFromFile(filepath))?.mime || 'application/octet-stream'
  } catch (err: any) {
    if (err.name === 'EndOfStreamError') {
      return 'application/octet-stream'
    }
    throw err
  }
}
