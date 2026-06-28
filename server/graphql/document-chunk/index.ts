import { builder } from '../builder.js'
import prisma from '../../../api/prisma.js'
import { chunkText } from '../../lib/chunking.js'

const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 120

builder.prismaObject('DocumentChunk', {
  fields: (t) => ({
    id: t.exposeID('id'),
    content: t.exposeString('content'),
    chunkIndex: t.exposeInt('chunkIndex'),
    document: t.relation('document'),
    createdAt: t.expose('createdAt', { type: 'DateTime' })
  })
})

const DocumentChunkWhere = builder.prismaWhere('DocumentChunk', {
  fields: {
    id: 'String',
    documentId: 'String'
  }
})

builder.queryFields((t) => ({
  documentChunks: t.prismaField({
    type: ['DocumentChunk'],
    args: {
      where: t.arg({ type: DocumentChunkWhere })
    },
    resolve: (query, _root, args) =>
      prisma.documentChunk.findMany({
        ...query,
        where: args.where ?? undefined
      })
  }),
  documentChunk: t.prismaField({
    type: 'DocumentChunk',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.documentChunk.findUnique({
        ...query,
        where: { id: String(args.id) }
      })
  })
}))

builder.mutationFields((t) => ({
  createDocumentChunk: t.prismaField({
    type: 'DocumentChunk',
    args: {
      documentId: t.arg.id({ required: true }),
      content: t.arg.string({ required: true }),
      chunkIndex: t.arg.int({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.documentChunk.create({
        ...query,
        data: {
          documentId: String(args.documentId),
          content: args.content,
          chunkIndex: args.chunkIndex
        }
      })
  }),
  deleteDocumentChunk: t.prismaField({
    type: 'DocumentChunk',
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.documentChunk.delete({
        ...query,
        where: { id: String(args.id) }
      })
  }),
  chunkDocument: t.prismaField({
    type: ['DocumentChunk'],
    args: {
      documentId: t.arg.id({ required: true }),
      text: t.arg.string({ required: true })
    },
    resolve: async (query, _root, args) => {
      const documentId = String(args.documentId)

      const chunks = chunkText(args.text, {
        chunkSize: CHUNK_SIZE,
        overlap: CHUNK_OVERLAP
      })

      await prisma.$transaction([
        prisma.documentChunk.deleteMany({
          where: { documentId }
        }),
        prisma.documentChunk.createMany({
          data: chunks.map((chunk) => ({
            documentId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex
          }))
        })
      ])

      return prisma.documentChunk.findMany({
        ...query,
        where: { documentId },
        orderBy: { chunkIndex: 'asc' }
      })
    }
  })
}))