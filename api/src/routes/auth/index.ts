import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  authenticate,
  JwtPayload,
} from '../../plugins/auth'

const prisma = new PrismaClient()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation error', details: parsed.error.flatten() })
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken({ userId: user.id })

    // Set refresh token as httpOnly cookie
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    })

    return reply.send({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    })
  })

  // POST /api/auth/refresh
  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies?.refreshToken
    if (!token) {
      return reply.status(401).send({ error: 'No refresh token' })
    }

    try {
      const { userId } = verifyRefreshToken(token)
      const user = await prisma.user.findUnique({ where: { id: userId } })

      if (!user || !user.isActive) {
        return reply.status(401).send({ error: 'User not found or inactive' })
      }

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      }

      const accessToken = signAccessToken(payload)

      return reply.send({ accessToken })
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' })
    }
  })

  // POST /api/auth/logout
  app.post('/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('refreshToken', { path: '/api/auth' })
    return reply.send({ message: 'Logged out' })
  })

  // GET /api/auth/me
  app.get(
    '/me',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user as JwtPayload

      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      })

      if (!dbUser) {
        return reply.status(404).send({ error: 'User not found' })
      }

      return reply.send(dbUser)
    }
  )
}
