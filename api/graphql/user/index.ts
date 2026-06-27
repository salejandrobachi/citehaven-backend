import { builder } from '../builder.js'
import prisma from '../../prisma.js'
import { StringFilter } from '../shared/filters.js'

builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    organization: t.relation('organization', { nullable: true }),
    vaults: t.relation('vaults')
  })
})

const UserWhere = builder.prismaWhere('User', {
  fields: {
    id: 'String',
    email: StringFilter,
    name: StringFilter
  }
})

builder.queryFields((t) => ({
  users: t.prismaField({
    type: ['User'],
    args: {
      where: t.arg({ type: UserWhere })
    },
    resolve: (query, _root, args) => {
      if (!args.where) {
        return prisma.user.findMany({ ...query })
      }

      const { email, name, ...restWhere } = args.where

      let emailFilter
      if (typeof email === 'string') {
        emailFilter = { equals: email, mode: 'insensitive' as const }
      } else if (email) {
        emailFilter = { ...email, mode: 'insensitive' as const }
      }

      let nameFilter
      if (typeof name === 'string') {
        nameFilter = { equals: name, mode: 'insensitive' as const }
      } else if (name) {
        nameFilter = { ...name, mode: 'insensitive' as const }
      }

      const where = {
        ...restWhere,
        ...(emailFilter ? { email: emailFilter } : {}),
        ...(nameFilter ? { name: nameFilter } : {})
      }

      return prisma.user.findMany({ ...query, where })
    }
  }),
  user: t.prismaField({
    type: 'User',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.user.findUnique({
        ...query,
        where: { id: String(args.id) }
      })
  })
}))

builder.mutationFields((t) => ({
  createUser: t.prismaField({
    type: 'User',
    args: {
      email: t.arg.string({ required: true }),
      name: t.arg.string({ required: false })
    },
    resolve: (query, _root, args) =>
      prisma.user.create({
        ...query,
        data: {
          email: args.email,
          name: args.name
        }
      })
  }),
  updateUser: t.prismaField({
    type: 'User',
    args: {
      id: t.arg.id({ required: true }),
      email: t.arg.string({ required: false }),
      name: t.arg.string({ required: false })
    },
    resolve: (query, _root, args) =>
      prisma.user.update({
        ...query,
        where: { id: String(args.id) },
        data: {
          ...(args.email ? { email: args.email } : {}),
          ...(args.name !== undefined ? { name: args.name } : {})
        }
      })
  }),
  deleteUser: t.prismaField({
    type: 'User',
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.user.delete({
        ...query,
        where: { id: String(args.id) }
      })
  })
}))