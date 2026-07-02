import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express5'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import express from 'express'
import cors from 'cors'
import { verifyToken } from '../server/lib/jwt.js'
import documentContentRouter from '../server/routes/document-content.js'
import userRouter from '../server/routes/user.js'
import { builder } from '../server/graphql/builder.js'
import '../server/graphql/organization/index.js'
import '../server/graphql/vault/index.js'
import '../server/graphql/user/index.js'
import '../server/graphql/document/index.js'
import '../server/graphql/document-chunk/index.js'
import '../server/graphql/auth/index.js'

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
app.use('/document', documentContentRouter)
app.use('/user', userRouter)
app.use('/', express.json(), expressMiddleware(server, {
  context: async ({ req }) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return { userId: null }
    try {
      const token = authHeader.slice(7)
      const payload = verifyToken(token)
      return { userId: payload.userId }
    } catch {
      return { userId: null }
    }
  }
}))

export default app