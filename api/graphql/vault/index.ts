import { builder } from '../builder.js'
import prisma from '../../prisma.js'
import { StringFilter } from '../shared/filters.js'

builder.prismaObject('Vault', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    ownerUser: t.relation('ownerUser', { nullable: true }),
    documents: t.relation('documents')
  })
})

const VaultWhere = builder.prismaWhere('Vault', {
  fields: {
    id: 'String',
    title: StringFilter
  }
})

builder.queryFields((t) => ({
  vaults: t.prismaField({
    type: ['Vault'],
    args: {
      where: t.arg({ type: VaultWhere })
    },
    resolve: (query, _root, args) => {
      if (!args.where) {
        return prisma.vault.findMany({ ...query })
      }

      const { title, ...restWhere } = args.where

      let titleFilter
      if (typeof title === 'string') {
        titleFilter = { equals: title, mode: 'insensitive' as const }
      } else if (title) {
        titleFilter = { ...title, mode: 'insensitive' as const }
      }

      const where = {
        ...restWhere,
        ...(titleFilter ? { title: titleFilter } : {})
      }

      return prisma.vault.findMany({ ...query, where })
    }
  }),
  vault: t.prismaField({
    type: 'Vault',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.vault.findUnique({
        ...query,
        where: { id: String(args.id) }
      })
  })
}))

builder.mutationFields((t) => ({
  createVault: t.prismaField({
    type: 'Vault',
    args: {
      title: t.arg.string({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.vault.create({
        ...query,
        data: { title: args.title }
      })
  }),
  updateVault: t.prismaField({
    type: 'Vault',
    args: {
      id: t.arg.id({ required: true }),
      title: t.arg.string({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.vault.update({
        ...query,
        where: { id: String(args.id) },
        data: { title: args.title }
      })
  }),
  deleteVault: t.prismaField({
    type: 'Vault',
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.vault.delete({
        ...query,
        where: { id: String(args.id) }
      })
  })
}))