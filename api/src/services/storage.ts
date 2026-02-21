import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { MultipartFile } from '@fastify/multipart'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
]

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || './uploads'
}

export function validateMimeType(mime: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mime)
}

export function getExtension(originalFilename: string): string {
  return path.extname(originalFilename) || '.bin'
}

export async function saveFile(
  file: MultipartFile,
  candidateId: string
): Promise<{ storagePath: string; fileSizeBytes: number; mimeType: string }> {
  const uploadDir = getUploadDir()
  const candidateDir = path.join(uploadDir, candidateId)

  if (!fs.existsSync(candidateDir)) {
    fs.mkdirSync(candidateDir, { recursive: true })
  }

  const ext = getExtension(file.filename)
  const filename = `${uuidv4()}${ext}`
  const storagePath = path.join(candidateDir, filename)

  // Stream the upload to disk
  const writeStream = fs.createWriteStream(storagePath)
  await pipeline(file.file, writeStream)

  const stats = fs.statSync(storagePath)
  return {
    storagePath: storagePath.replace(/\\/g, '/'), // normalize to forward slashes
    fileSizeBytes: stats.size,
    mimeType: file.mimetype,
  }
}

export function deleteFile(storagePath: string): void {
  if (fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath)
  }
}

export function createReadStream(storagePath: string): fs.ReadStream {
  return fs.createReadStream(storagePath)
}

export function fileExists(storagePath: string): boolean {
  return fs.existsSync(storagePath)
}
