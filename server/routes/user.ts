import { Router } from 'express'
import type { Request, Response } from 'express'
import multer from 'multer'
import { put, del } from '@vercel/blob'
import prisma from '../../api/prisma.js'
import { verifyToken } from '../lib/jwt.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

router.post('/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
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

  if (!req.file) {
    res.status(400).json({ error: 'No se recibió ningún archivo.' })
    return
  }

  if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
    res.status(400).json({ error: 'Solo se permiten imágenes JPG, PNG o WebP.' })
    return
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true }
  })

  if (existingUser?.avatarUrl) {
    await del(existingUser.avatarUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN
    })
  }

  const blob = await put(`avatars/${userId}`, req.file.buffer, {
    access: 'public',
    contentType: req.file.mimetype,
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN
  })

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: blob.url }
  })

  res.status(200).json({ avatarUrl: blob.url })
})

export default router