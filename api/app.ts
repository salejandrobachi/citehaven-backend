import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
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