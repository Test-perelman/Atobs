import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authenticate, requireRole, JwtPayload } from '../../plugins/auth'

const prisma = new PrismaClient()

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'recruiter', 'hiring_manager', 'viewer']),
})

export default async function atsUsersRoutes(app: FastifyInstance) {
  // GET /api/ats/users
  app.get(
    '/',
    { preHandler: requireRole(['admin']) },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return reply.send(users)
    }
  )

  // POST /api/ats/users
  app.post(
    '/',
    { preHandler: requireRole(['admin']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createUserSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation error', details: parsed.error.flatten() })
      }

      const { email, password, fullName, role } = parsed.data

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return reply.status(409).send({ error: 'Email already in use' })
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: { email, passwordHash, fullName, role },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      })

      return reply.status(201).send(user)
    }
  )

  // PATCH /api/ats/users/:id
  app.patch(
    '/:id',
    { preHandler: requireRole(['admin']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const { role, isActive, fullName } = request.body as {
        role?: string
        isActive?: boolean
        fullName?: string
      }

      // Prevent self-deactivation
      const requestUser = (request as any).user as JwtPayload
      if (id === requestUser.userId && isActive === false) {
        return reply.status(400).send({ error: 'Cannot deactivate your own account' })
      }

      const updateData: any = {}
      if (role) updateData.role = role
      if (typeof isActive === 'boolean') updateData.isActive = isActive
      if (fullName) updateData.fullName = fullName

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      })

      return reply.send(user)
    }
  )

  // GET /api/ats/users/recruiters (for dropdowns)
  app.get(
    '/recruiters',
    { preHandler: authenticate },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const recruiters = await prisma.user.findMany({
        where: {
          role: { in: ['admin', 'recruiter', 'hiring_manager'] },
          isActive: true,
        },
        select: { id: true, fullName: true, email: true, role: true },
        orderBy: { fullName: 'asc' },
      })
      return reply.send(recruiters)
    }
  )
}
