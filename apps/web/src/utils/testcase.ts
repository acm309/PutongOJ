import type { FileEntry } from '@zip.js/zip.js'
import { BlobReader, BlobWriter, ZipReader } from '@zip.js/zip.js'

export interface TestcasePair {
  inputName: string
  outputName: string
  inputContent: string
  outputContent: string
}

export class TestcaseZipParser {
  private zipReader: ZipReader<Blob> | null = null

  constructor (private file: File) { }

  async parse (): Promise<TestcasePair[]> {
    this.zipReader = new ZipReader(new BlobReader(this.file))
    const entries = await this.zipReader.getEntries()

    const fileMap = new Map<string, FileEntry>()
    for (const entry of entries) {
      if (!entry.directory) {
        fileMap.set(entry.filename, entry)
      }
    }

    const testcasePairs: TestcasePair[] = []
    const processed = new Set<string>()
    for (const [ filename, entry ] of fileMap) {
      if (processed.has(filename)) continue

      let match: RegExpMatchArray | null
      let pairedFilename: string | undefined

      match = filename.match(/^(.*)input(.*)\.txt$/i)
      if (match) {
        const prefix = match[1]
        const indicator = match[2]
        pairedFilename = `${prefix}output${indicator}.txt`
      }

      match = filename.match(/^(.+)\.in$/i)
      if (match) {
        const prefix = match[1]
        pairedFilename = `${prefix}.out`
      }

      if (pairedFilename && fileMap.has(pairedFilename)) {
        const pairedEntry = fileMap.get(pairedFilename)!

        try {
          const inputContent = await this.readEntryContent(entry)
          const outputContent = await this.readEntryContent(pairedEntry)

          if (!inputContent.trim() && !outputContent.trim()) {
            throw new Error(`Both files ${filename} and ${pairedFilename} are empty or whitespace only`)
          }

          testcasePairs.push({
            inputName: filename,
            outputName: pairedFilename,
            inputContent,
            outputContent,
          })

          processed.add(filename)
          processed.add(pairedFilename)
        } catch (error) {
          console.warn(`Failed to read testcase pair ${filename} and ${pairedFilename}:`, error)
        }
      }
    }

    await this.close()
    return testcasePairs
  }

  private async readEntryContent (entry: FileEntry): Promise<string> {
    const blob = await entry.getData!(new BlobWriter())
    const content = await blob.text()
    if (!/^[\s\x21-\x7E]*$/.test(content)) {
      throw new Error(`File ${entry.filename} contains non-ASCII characters`)
    }
    return content
  }

  async close (): Promise<void> {
    if (this.zipReader) {
      await this.zipReader.close()
      this.zipReader = null
    }
  }
}
