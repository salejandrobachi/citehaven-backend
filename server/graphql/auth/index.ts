import bcrypt from 'bcrypt'
import { builder } from '../builder.js'
import prisma from '../../../api/prisma.js'
import { signToken } from '../../lib/jwt.js'

const SALT_ROUNDS = 12

const AuthPayload = builder.objectType(
  builder.objectRef<{ token: string; userId: string; email: string }>('AuthPayload'),
  {
    fields: (t) => ({
      token: t.exposeString('token'),
      userId: t.exposeString('userId'),
      email: t.exposeString('email'),
    }),
  }
)

builder.mutationFields((t) => ({
  register: t.field({
    type: AuthPayload,
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
      name: t.arg.string(),
      organizationCode: t.arg.string(),
    },
    resolve: async (_root, args) => {
      const existing = await prisma.user.findUnique({
        where: { email: args.email },
      })
      if (existing) throw new Error('Ya existe una cuenta con ese email.')

      let organizationId: string | null = null
      if (args.organizationCode) {
        const org = await prisma.organization.findUnique({
          where: { code: args.organizationCode },
        })
        if (!org) throw new Error('Código de organización inválido.')
        organizationId = org.id
      }

      const passwordHash = await bcrypt.hash(args.password, SALT_ROUNDS)

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: args.email,
            name: args.name ?? null,
            passwordHash,
            organizationId,
          },
        })
        await tx.vault.create({
          data: {
            title: 'Mi espacio',
            ownerUserId: newUser.id,
          },
        })
        return newUser
      })

      const token = signToken({ userId: user.id, email: user.email })
      return { token, userId: user.id, email: user.email }
    },
  }),

  login: t.field({
    type: AuthPayload,
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const user = await prisma.user.findUnique({
        where: { email: args.email },
      })
      if (!user) throw new Error('Credenciales inválidas.')

      const valid = await bcrypt.compare(args.password, user.passwordHash)
      if (!valid) throw new Error('Credenciales inválidas.')

      const token = signToken({ userId: user.id, email: user.email })
      return { token, userId: user.id, email: user.email }
    },
  }),

  updateCredentials: t.field({
    type: 'Boolean',
    args: {
      newEmail: t.arg.string(),
      newPassword: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')

      const data: { email?: string; passwordHash?: string } = {}

      if (args.newEmail) {
        const existing = await prisma.user.findUnique({
          where: { email: args.newEmail },
        })
        if (existing) throw new Error('Ese email ya está en uso.')
        data.email = args.newEmail
      }

      if (args.newPassword) {
        data.passwordHash = await bcrypt.hash(args.newPassword, SALT_ROUNDS)
      }

      if (Object.keys(data).length === 0) return true

      await prisma.user.update({
        where: { id: ctx.userId },
        data,
      })
      return true
    },
  }),

  deleteAccount: t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.userId) throw new Error('No autenticado.')

      await prisma.$transaction(async (tx) => {
        const vaults = await tx.vault.findMany({
          where: { ownerUserId: ctx.userId! },
          select: { id: true },
        })
        const vaultIds = vaults.map((v) => v.id)

        const documents = await tx.document.findMany({
          where: { vaultId: { in: vaultIds } },
          select: { id: true },
        })
        const docIds = documents.map((d) => d.id)

        await tx.documentChunk.deleteMany({ where: { documentId: { in: docIds } } })
        await tx.chatMessage.deleteMany({ where: { vaultId: { in: vaultIds } } })
        await tx.document.deleteMany({ where: { id: { in: docIds } } })
        await tx.vault.deleteMany({ where: { id: { in: vaultIds } } })
        await tx.user.delete({ where: { id: ctx.userId! } })
      })

      return true
    },
  }),
}))