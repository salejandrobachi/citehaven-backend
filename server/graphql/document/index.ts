import { builder } from '../builder.js'
import prisma from '../../../api/prisma.js'
import { StringFilter } from '../shared/filters.js'
import { extractTextFromBlob } from '../../lib/extract-text.js'
import { chunkText } from '../../lib/chunking.js'
import { generateEmbedding } from '../../lib/embeddings.js'

const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 120

builder.prismaObject('Document', {
  fields: t => ({
    id: t.exposeID('id'),
    filename: t.exposeString('filename'),
    fileType: t.exposeString('fileType'),
    storageUrl: t.exposeString('storageUrl'),
    status: t.exposeString('status'),
    vault: t.relation('vault'),
    createdAt: t.expose('createdAt', { type: 'DateTime' })
  })
})

const DocumentWhere = builder.prismaWhere('Document', {
  fields: {
    id: 'String',
    vaultId: 'String',
    filename: StringFilter,
    status: 'String'
  }
})

builder.queryFields(t => ({
  documents: t.prismaField({
    type: ['Document'],
    args: {
      where: t.arg({ type: DocumentWhere })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      if (!args.where?.vaultId) throw new Error('Se requiere vaultId.')

      const vault = await prisma.vault.findUnique({
        where: { id: String(args.where.vaultId) }
      })
      if (!vault || vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')

      const { filename, vaultId, ...restWhere } = args.where
      let filenameFilter
      if (typeof filename === 'string') {
        filenameFilter = { equals: filename, mode: 'insensitive' as const }
      } else if (filename) {
        filenameFilter = { ...filename, mode: 'insensitive' as const }
      }

      return prisma.document.findMany({
        ...query,
        where: {
          ...restWhere,
          vaultId: String(vaultId),
          ...(filenameFilter ? { filename: filenameFilter } : {})
        }
      })
    }
  }),
  document: t.prismaField({
    type: 'Document',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      const check = await prisma.document.findUnique({
        where: { id: String(args.id) },
        include: { vault: true }
      })
      if (check && check.vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')
      return prisma.document.findUnique({
        ...query,
        where: { id: String(args.id) }
      })
    }
  })
}))

builder.mutationFields(t => ({
  createDocument: t.prismaField({
    type: 'Document',
    args: {
      vaultId: t.arg.id({ required: true }),
      filename: t.arg.string({ required: true }),
      fileType: t.arg.string({ required: true }),
      storageUrl: t.arg.string({ required: true })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      const vault = await prisma.vault.findUnique({
        where: { id: String(args.vaultId) }
      })
      if (!vault || vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')
      return prisma.document.create({
        ...query,
        data: {
          vaultId: String(args.vaultId),
          filename: args.filename,
          fileType: args.fileType,
          storageUrl: args.storageUrl
        }
      })
    }
  }),
  updateDocumentStatus: t.prismaField({
    type: 'Document',
    args: {
      id: t.arg.id({ required: true }),
      status: t.arg.string({ required: true })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      const doc = await prisma.document.findUnique({
        where: { id: String(args.id) },
        include: { vault: true }
      })
      if (!doc || doc.vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')
      return prisma.document.update({
        ...query,
        where: { id: String(args.id) },
        data: { status: args.status }
      })
    }
  }),
  deleteDocument: t.prismaField({
    type: 'Document',
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      const doc = await prisma.document.findUnique({
        where: { id: String(args.id) },
        include: { vault: true }
      })
      if (!doc || doc.vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')
      return prisma.document.delete({
        ...query,
        where: { id: String(args.id) }
      })
    }
  }),
  processDocument: t.prismaField({
    type: 'Document',
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      const documentId = String(args.id)

      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { vault: true }
      })
      if (!document) throw new Error('Document no encontrado.')
      if (document.vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')

      try {
        const text = await extractTextFromBlob(
          document.storageUrl,
          document.fileType
        )
        const chunks = chunkText(text, {
          chunkSize: CHUNK_SIZE,
          overlap: CHUNK_OVERLAP
        })

        const chunksWithEmbeddings = await Promise.all(
          chunks.map(async chunk => ({
            documentId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            embedding: await generateEmbedding(chunk.content)
          }))
        )

        await prisma.$transaction([
          prisma.documentChunk.deleteMany({ where: { documentId } }),
          prisma.documentChunk.createMany({
            data: chunksWithEmbeddings.map(({ embedding, ...rest }) => rest)
          })
        ])

        // Actualizar embeddings uno por uno (createMany no soporta tipos Unsupported)
        const createdChunks = await prisma.documentChunk.findMany({
          where: { documentId },
          orderBy: { chunkIndex: 'asc' }
        })

        await Promise.all(
          createdChunks.map(
            (chunk, i) =>
              prisma.$executeRaw`
      UPDATE document_chunks
      SET embedding = ${JSON.stringify(
        chunksWithEmbeddings[i].embedding
      )}::vector
      WHERE id = ${chunk.id}
    `
          )
        )

        return prisma.document.update({
          ...query,
          where: { id: documentId },
          data: { status: 'processed' }
        })
      } catch (error) {
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'failed' }
        })
        throw error
      }
    }
  })
}))
