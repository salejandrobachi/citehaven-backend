import { builder } from '../builder.js'
import prisma from '../../../api/prisma.js'
import { StringFilter } from '../shared/filters.js'

builder.prismaObject('Document', {
  fields: (t) => ({
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

builder.queryFields((t) => ({
  documents: t.prismaField({
    type: ['Document'],
    args: {
      where: t.arg({ type: DocumentWhere })
    },
    resolve: (query, _root, args) => {
      if (!args.where) {
        return prisma.document.findMany({ ...query })
      }

      const { filename, ...restWhere } = args.where

      let filenameFilter
      if (typeof filename === 'string') {
        filenameFilter = { equals: filename, mode: 'insensitive' as const }
      } else if (filename) {
        filenameFilter = { ...filename, mode: 'insensitive' as const }
      }

      const where = {
        ...restWhere,
        ...(filenameFilter ? { filename: filenameFilter } : {})
      }

      return prisma.document.findMany({ ...query, where })
    }
  }),
  document: t.prismaField({
    type: 'Document',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.document.findUnique({
        ...query,
        where: { id: String(args.id) }
      })
  })
}))

builder.mutationFields((t) => ({
  createDocument: t.prismaField({
    type: 'Document',
    args: {
      vaultId: t.arg.id({ required: true }),
      filename: t.arg.string({ required: true }),
      fileType: t.arg.string({ required: true }),
      storageUrl: t.arg.string({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.document.create({
        ...query,
        data: {
          vaultId: String(args.vaultId),
          filename: args.filename,
          fileType: args.fileType,
          storageUrl: args.storageUrl
        }
      })
  }),
  updateDocumentStatus: t.prismaField({
    type: 'Document',
    args: {
      id: t.arg.id({ required: true }),
      status: t.arg.string({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.document.update({
        ...query,
        where: { id: String(args.id) },
        data: { status: args.status }
      })
  }),
  deleteDocument: t.prismaField({
    type: 'Document',
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.document.delete({
        ...query,
        where: { id: String(args.id) }
      })
  })
}))