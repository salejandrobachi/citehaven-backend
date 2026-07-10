import prisma from '../../api/prisma.js'
import { generateEmbedding } from './embeddings.js'

export interface SearchResult {
  chunkId: string
  documentId: string
  filename: string
  content: string
  similarity: number
}

interface RawSearchResult {
  chunk_id: string
  document_id: string
  filename: string
  content: string
  similarity: number
}

export async function semanticSearch(
  query: string,
  vaultId: string,
  topK: number = 5
): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query, 'RETRIEVAL_QUERY')
  const embeddingStr = JSON.stringify(queryEmbedding)

  const results: RawSearchResult[] = await prisma.$queryRaw`
    SELECT
      dc.id as chunk_id,
      dc.document_id,
      d.filename,
      dc.content,
      1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE d.vault_id = ${vaultId}
      AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> ${embeddingStr}::vector
    LIMIT ${topK}
  `

  return results.map(r => ({
    chunkId: r.chunk_id,
    documentId: r.document_id,
    filename: r.filename,
    content: r.content,
    similarity: Number(r.similarity)
  }))
}