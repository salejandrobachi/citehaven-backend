import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import express from 'express';
import cors from 'cors';
import { DateTimeResolver } from 'graphql-scalars';
import prisma from './prisma.js';

const typeDefs = `#graphql
  scalar DateTime

  type Organization {
    id: ID!
    name: String!
    createdAt: DateTime!
  }

  type Vault {
    id: ID!
    title: String!
    createdAt: DateTime!
  }

  type Query {
    organizations: [Organization!]!
    vaults: [Vault!]!
  }

  type Mutation {
    createOrganization(name: String!): Organization!
    createVault(title: String!): Vault!
  }
`;

const resolvers = {
  DateTime: DateTimeResolver,
  Query: {
    organizations: () => prisma.organization.findMany(),
    vaults: () => prisma.vault.findMany(),
  },
  Mutation: {
    createOrganization: (_: unknown, args: { name: string }) =>
      prisma.organization.create({ data: { name: args.name } }),
    createVault: (_: unknown, args: { title: string }) =>
      prisma.vault.create({ data: { title: args.title } }),
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, //cuando se termine poner en false
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })], //cuando se termine quitar el plugin
});
await server.start();

const app = express();

app.use(
  '/',
  cors(),
  express.json(),
  expressMiddleware(server),
);

export default app;