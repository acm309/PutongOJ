import { ExportFormat } from '@putongoj/shared'
import { stringify } from 'csv-stringify/browser/esm/sync'

export function downloadBlob (blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportJSON (data: any, filename: string) {
  const jsonString = JSON.stringify(data, null, 2)

  const blob = new Blob([ jsonString ], {
    type: 'application/json;charset=utf-8;',
  })
  downloadBlob(blob, `${filename}.json`)
}

export function exportCSV (
  data: Record<string, any>[],
  filename: string,
  bom: boolean = false,
) {
  const columnsSet = new Set<string>()
  data.forEach((item) => {
    Object.keys(item).forEach(key => columnsSet.add(key))
  })
  const columns = Array.from(columnsSet)
  const csvString = stringify(data, {
    bom,
    columns,
    header: true,
  })

  const blob = new Blob([ csvString ], {
    type: 'text/csv;charset=utf-8;',
  })
  downloadBlob(blob, `${filename}.csv`)
}

export function exportDataToFile (
  data: Record<string, any>[],
  filename: string,
  format: ExportFormat,
) {
  switch (format) {
    case ExportFormat.JSON_UTF8:
      exportJSON(data, filename)
      break
    case ExportFormat.CSV_UTF8:
      exportCSV(data, filename, false)
      break
    case ExportFormat.CSV_UTF8_BOM:
      exportCSV(data, filename, true)
      break
    default:
      throw new Error('Unsupported export format')
  }
}
