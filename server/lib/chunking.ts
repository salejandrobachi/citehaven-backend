interface ChunkOptions {
  chunkSize: number
  overlap: number
}

interface Chunk {
  content: string
  chunkIndex: number
}

export function chunkText(text: string, options: ChunkOptions): Chunk[] {
  const { chunkSize, overlap } = options
  const chunks: Chunk[] = []

  let start = 0
  let chunkIndex = 0

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length)

    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end)
      if (lastSpace > start) {
        end = lastSpace
      }
    }

    const content = text.slice(start, end).trim()
    if (content.length > 0) {
      chunks.push({ content, chunkIndex })
      chunkIndex++
    }

    if (end >= text.length) {
      break
    }

    let newStart = end - overlap
    if (newStart > 0) {
      const nextSpace = text.indexOf(' ', newStart)
      if (nextSpace !== -1 && nextSpace < end) {
        newStart = nextSpace + 1
      }
    }

    start = Math.max(newStart, 0)
  }

  return chunks
}