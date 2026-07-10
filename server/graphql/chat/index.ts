import { builder } from '../builder.js'
import { semanticSearch } from '../../lib/semantic-search.js'
import { chatWithDocuments } from '../../lib/chat.js'

const SearchResultType = builder.objectType(
  builder.objectRef<{
    chunkId: string
    documentId: string
    filename: string
    content: string
    similarity: number
  }>('SearchResult'),
  {
    fields: t => ({
      chunkId: t.exposeString('chunkId'),
      documentId: t.exposeString('documentId'),
      filename: t.exposeString('filename'),
      content: t.exposeString('content'),
      similarity: t.exposeFloat('similarity')
    })
  }
)

const ChatSourceType = builder.objectType(
  builder.objectRef<{
    filename: string
    excerpt: string
    similarity: number
  }>('ChatSource'),
  {
    fields: t => ({
      filename: t.exposeString('filename'),
      excerpt: t.exposeString('excerpt'),
      similarity: t.exposeFloat('similarity')
    })
  }
)

const ChatResponseType = builder.objectType(
  builder.objectRef<{
    answer: string
    confidenceScore: number
    sources: Array<{ filename: string; excerpt: string; similarity: number }>
  }>('ChatResponse'),
  {
    fields: t => ({
      answer: t.exposeString('answer'),
      confidenceScore: t.exposeFloat('confidenceScore'),
      sources: t.expose('sources', { type: [ChatSourceType] })
    })
  }
)

builder.queryFields(t => ({
  searchDocuments: t.field({
    type: [SearchResultType],
    args: {
      query: t.arg.string({ required: true }),
      vaultId: t.arg.id({ required: true })
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      return semanticSearch(args.query, String(args.vaultId))
    }
  }),

  chat: t.field({
    type: ChatResponseType,
    args: {
      query: t.arg.string({ required: true }),
      vaultId: t.arg.id({ required: true }),
      topK: t.arg.int()
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')

      const results = await semanticSearch(
        args.query,
        String(args.vaultId),
        args.topK ?? 5
      )

      return chatWithDocuments(args.query, results)
    }
  })
}))