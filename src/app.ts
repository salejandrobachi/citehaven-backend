import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';

const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Citehaven backend funcionando 🎉',
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

const app = express();

app.use(
  '/',
  cors(),
  express.json(),
  expressMiddleware(server),
);

export default app;