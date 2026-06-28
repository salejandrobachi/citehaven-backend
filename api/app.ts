import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express5'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import express from 'express'
import cors from 'cors'

import { builder } from './graphql/builder.js'
import './graphql/organization/index.js'
import './graphql/vault/index.js'
import './graphql/user/index.js'
import './graphql/document/index.js'
import './graphql/document-chunk/index.js'

const schema = builder.toSchema()

const server = new ApolloServer({
  schema,
  introspection: true, //cuando se termine poner en false
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })] //cuando se termine quitar el plugin
})
await server.start()

const app = express()

app.use('/', cors(), express.json(), expressMiddleware(server))

export default app
