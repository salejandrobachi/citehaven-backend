import { Router } from 'express'
import type { Request, Response } from 'express'
import { get } from '@vercel/blob'
import prisma from '../../api/prisma.js'
import { verifyToken } from '../lib/jwt.js'

const router = Router()

router.get('/:id/content', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autenticado.' })
    return
  }

  let userId: string
  try {
    const payload = verifyToken(authHeader.slice(7))
    userId = payload.userId
  } catch {
    res.status(401).json({ error: 'Token inválido.' })
    return
  }

  const document = await prisma.document.findUnique({
    where: { id: String(req.params.id) },
    include: { vault: true }
  })

  if (!document) {
    res.status(404).json({ error: 'Documento no encontrado.' })
    return
  }

  if (document.vault.ownerUserId !== userId) {
    res.status(403).json({ error: 'No autorizado.' })
    return
  }

  const blob = await get(document.storageUrl, {
    access: 'private',
    token: process.env.BLOB_READ_WRITE_TOKEN
  })

  if (!blob || !blob.stream) {
    res.status(500).json({ error: 'No se pudo obtener el archivo.' })
    return
  }

  res.setHeader('Content-Type', document.fileType)
  res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`)

  const reader = blob.stream.getReader()
  const passThrough = async () => {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }
    res.end()
  }

  await passThrough()
})

export default router