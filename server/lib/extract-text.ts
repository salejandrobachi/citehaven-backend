import { get } from '@vercel/blob'
import { PDFParse } from 'pdf-parse'

export async function extractTextFromBlob(storageUrl: string, fileType: string): Promise<string> {
  const result = await get(storageUrl, {
    access: 'private',
    token: process.env.BLOB_READ_WRITE_TOKEN
  })

  if (!result || !result.stream) {
    throw new Error('No se encontró el blob o no tiene contenido en la URL proporcionada')
  }

  const reader = result.stream.getReader()
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }

  const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))

  if (fileType === 'application/pdf') {
    const parser = new PDFParse({ data: buffer })
    const pdfResult = await parser.getText()
    await parser.destroy()
    return pdfResult.text
  }

  return buffer.toString('utf-8')
}