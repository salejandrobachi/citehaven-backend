import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express5'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import express from 'express'
import cors from 'cors'

import { builder } from '../server/graphql/builder.js'
import '../server/graphql/organization/index.js'
import '../server/graphql/vault/index.js'
import '../server/graphql/user/index.js'
import '../server/graphql/document/index.js'
import '../server/graphql/document-chunk/index.js'

import uploadRouter from '../server/upload.js'

const schema = builder.toSchema()

const server = new ApolloServer({
  schema,
  introspection: true, //cuando se termine poner en false
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })] //cuando se termine quitar el plugin
})
await server.start()

const app = express()

app.use(cors())
app.use('/upload', uploadRouter)
app.use('/', express.json(), expressMiddleware(server))

export default app