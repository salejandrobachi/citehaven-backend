import { builder } from '../builder.js'
import prisma from '../../../api/prisma.js'

builder.prismaObject('DocumentChunk', {
  fields: t => ({
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

builder.queryFields(t => ({
  documentChunks: t.prismaField({
    type: ['DocumentChunk'],
    args: {
      where: t.arg({ type: DocumentChunkWhere })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      if (!args.where?.documentId) throw new Error('Se requiere documentId.')

      const doc = await prisma.document.findUnique({
        where: { id: String(args.where.documentId) },
        include: { vault: true }
      })
      if (!doc || doc.vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')

      return prisma.documentChunk.findMany({
        ...query,
        where: { documentId: String(args.where.documentId) }
      })
    }
  }),
  documentChunk: t.prismaField({
    type: 'DocumentChunk',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      const check = await prisma.documentChunk.findUnique({
        where: { id: String(args.id) },
        include: { document: { include: { vault: true } } }
      })
      if (check && check.document.vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')
      return prisma.documentChunk.findUnique({
        ...query,
        where: { id: String(args.id) }
      })
    }
  })
}))

builder.mutationFields(t => ({
  deleteDocumentChunk: t.prismaField({
    type: 'DocumentChunk',
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      const check = await prisma.documentChunk.findUnique({
        where: { id: String(args.id) },
        include: { document: { include: { vault: true } } }
      })
      if (!check || check.document.vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')
      return prisma.documentChunk.delete({
        ...query,
        where: { id: String(args.id) }
      })
    }
  })
}))
