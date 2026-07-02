import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import PrismaUtils from '@pothos/plugin-prisma-utils'
import { DateTimeResolver } from 'graphql-scalars'
import type PrismaTypes from '../../generated/pothos-types.js'
import { getDatamodel } from '../../generated/pothos-types.js'
import prisma from '../../api/prisma.js'

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes
  Scalars: {
    DateTime: { Input: Date; Output: Date }
  }
  Context: {
    userId: string | null
  }
}>({
  plugins: [PrismaPlugin, PrismaUtils],
  prisma: {
    client: prisma,
    dmmf: getDatamodel()
  }
})

builder.addScalarType('DateTime', DateTimeResolver)

builder.queryType({})
builder.mutationType({})
