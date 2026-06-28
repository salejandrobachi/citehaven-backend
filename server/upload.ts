import { Router } from 'express'
import multer from 'multer'
import { put } from '@vercel/blob'

const upload = multer({ storage: multer.memoryStorage() })

const router = Router()

router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file

  if (!file) {
    res.status(400).json({ error: 'No se recibió ningún archivo' })
    return
  }

  const blob = await put(file.originalname, file.buffer, {
    access: 'private',
    contentType: file.mimetype,
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN
  })

  res.status(200).json({
    storageUrl: blob.url,
    filename: file.originalname,
    fileType: file.mimetype
  })
})

export default router