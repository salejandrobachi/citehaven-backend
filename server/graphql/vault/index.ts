import { builder } from '../builder.js'
import prisma from '../../../api/prisma.js'
import { StringFilter } from '../shared/filters.js'

builder.prismaObject('Vault', {
  fields: t => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    ownerUser: t.relation('ownerUser'),
    documents: t.relation('documents')
  })
})

const VaultWhere = builder.prismaWhere('Vault', {
  fields: {
    id: 'String',
    title: StringFilter
  }
})

builder.queryFields(t => ({
  vaults: t.prismaField({
    type: ['Vault'],
    args: {
      where: t.arg({ type: VaultWhere })
    },
    resolve: (query, _root, _args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      return prisma.vault.findMany({
        ...query,
        where: { ownerUserId: ctx.userId }
      })
    }
  }),
  vault: t.prismaField({
    type: 'Vault',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      const vault = await prisma.vault.findUnique({
        ...query,
        where: { id: String(args.id) }
      })
      if (vault && vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')
      return vault
    }
  })
}))

builder.mutationFields(t => ({
  createVault: t.prismaField({
    type: 'Vault',
    args: {
      title: t.arg.string({ required: true })
    },
    resolve: (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      return prisma.vault.create({
        ...query,
        data: { title: args.title, ownerUserId: ctx.userId }
      })
    }
  }),
  updateVault: t.prismaField({
    type: 'Vault',
    args: {
      id: t.arg.id({ required: true }),
      title: t.arg.string({ required: true })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      const vault = await prisma.vault.findUnique({
        where: { id: String(args.id) }
      })
      if (!vault || vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')
      return prisma.vault.update({
        ...query,
        where: { id: String(args.id) },
        data: { title: args.title }
      })
    }
  }),
  deleteVault: t.prismaField({
    type: 'Vault',
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')
      const vault = await prisma.vault.findUnique({
        where: { id: String(args.id) }
      })
      if (!vault || vault.ownerUserId !== ctx.userId)
        throw new Error('No autorizado.')
      return prisma.vault.delete({
        ...query,
        where: { id: String(args.id) }
      })
    }
  })
}))
