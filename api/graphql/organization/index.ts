import { builder } from '../builder.js'
import prisma from '../../prisma.js'
import { StringFilter } from '../shared/filters.js'

builder.prismaObject('Organization', {
  fields: t => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    users: t.relation('users')
  })
})

const OrganizationWhere = builder.prismaWhere('Organization', {
  fields: {
    id: 'String',
    name: StringFilter
  }
})

builder.queryFields(t => ({
  organizations: t.prismaField({
    type: ['Organization'],
    args: {
      where: t.arg({ type: OrganizationWhere })
    },
    resolve: (query, _root, args) => {
      if (!args.where) {
        return prisma.organization.findMany({ ...query })
      }

      const { name, ...restWhere } = args.where

      let nameFilter
      if (typeof name === 'string') {
        nameFilter = { equals: name, mode: 'insensitive' as const }
      } else if (name) {
        nameFilter = { ...name, mode: 'insensitive' as const }
      }

      const where = {
        ...restWhere,
        ...(nameFilter ? { name: nameFilter } : {})
      }

      return prisma.organization.findMany({ ...query, where })
    }
  }),
  organization: t.prismaField({
    type: 'Organization',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.organization.findUnique({
        ...query,
        where: { id: String(args.id) }
      })
  })
}))

builder.mutationFields(t => ({
  createOrganization: t.prismaField({
    type: 'Organization',
    args: {
      name: t.arg.string({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.organization.create({
        ...query,
        data: { name: args.name }
      })
  }),
  updateOrganization: t.prismaField({
    type: 'Organization',
    args: {
      id: t.arg.id({ required: true }),
      name: t.arg.string({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.organization.update({
        ...query,
        where: { id: String(args.id) },
        data: { name: args.name }
      })
  }),
  deleteOrganization: t.prismaField({
    type: 'Organization',
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _root, args) =>
      prisma.organization.delete({
        ...query,
        where: { id: String(args.id) }
      })
  })
}))
