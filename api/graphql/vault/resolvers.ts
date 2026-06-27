import prisma from '../../prisma.js';

export const vaultResolvers = {
    Query: {
        vaults: () => prisma.vault.findMany(),
        vault: (_: unknown, args: { id: string }) =>
            prisma.vault.findUnique({ where: { id: args.id } }),
    },
    Mutation: {
        createVault: (_: unknown, args: { title: string }) =>
            prisma.vault.create({ data: { title: args.title } }),
        updateVault: (_: unknown, args: { id: string; title: string }) =>
            prisma.vault.update({
                where: { id: args.id },
                data: { title: args.title },
            }),
        deleteVault: (_: unknown, args: { id: string }) =>
            prisma.vault.delete({ where: { id: args.id } }),
    },
};