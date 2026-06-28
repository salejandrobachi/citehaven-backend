import { Router } from 'express'
import multer from 'multer'
import { put } from '@vercel/blob'

const upload = multer({ storage: multer.memoryStorage() })

const router = Router()

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se recibió ningún archivo' })
    return
  }

  const blob = await put(req.file.originalname, req.file.buffer, {
    access: 'private',
    contentType: req.file.mimetype,
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN
  })

  res.status(200).json({
    storageUrl: blob.url,
    filename: req.file.originalname,
    fileType: req.file.mimetype
  })
})

export default router