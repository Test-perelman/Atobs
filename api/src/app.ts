import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import path from 'path'
import fs from 'fs'

// Routes
import authRoutes from './routes/auth/index'
import publicJobRoutes from './routes/public/jobs'
import applyRoute from './routes/public/apply'
import atsJobRoutes from './routes/ats/jobs'
import atsApplicationRoutes from './routes/ats/applications'
import atsNotesRoutes from './routes/ats/notes'
import atsDocumentsRoutes from './routes/ats/documents'
import atsAnalyticsRoutes from './routes/ats/analytics'
import atsUsersRoutes from './routes/ats/users'

const app = Fastify({
  logger: process.env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : true,
})

async function start() {
  // Ensure uploads directory exists
  const uploadDir = process.env.UPLOAD_DIR || './uploads'
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  // Plugins
  await app.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      process.env.FRONTEND_URL || 'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(cookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'cookie-secret',
    hook: 'onRequest',
  })

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Try again in a moment.',
    }),
  })

  // Root + Health check
  app.get('/', async () => ({
    name: 'ATOBS API',
    status: 'ok',
    version: '1.0.0',
    docs: 'Visit http://localhost:5173 for the frontend',
  }))
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(publicJobRoutes, { prefix: '/api/jobs' })
  await app.register(applyRoute, { prefix: '/api/jobs' })
  await app.register(atsJobRoutes, { prefix: '/api/ats/jobs' })
  await app.register(atsApplicationRoutes, { prefix: '/api/ats/applications' })
  await app.register(atsNotesRoutes, { prefix: '/api/ats/applications' })
  await app.register(atsDocumentsRoutes, { prefix: '/api/ats' })
  await app.register(atsAnalyticsRoutes, { prefix: '/api/ats/analytics' })
  await app.register(atsUsersRoutes, { prefix: '/api/ats/users' })

  const port = parseInt(process.env.PORT || '3001', 10)
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`\n🚀 ATOBS API running at http://localhost:${port}`)
  console.log(`📋 Health check: http://localhost:${port}/health\n`)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
