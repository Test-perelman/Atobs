import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' })
}

export function signRefreshToken(payload: Pick<JwtPayload, 'userId'>): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
}

export function verifyRefreshToken(token: string): Pick<JwtPayload, 'userId'> {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as Pick<JwtPayload, 'userId'>
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid token' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = verifyAccessToken(token)
    ;(request as any).user = payload
  } catch {
    reply.status(401).send({ error: 'Unauthorized', message: 'Token expired or invalid' })
  }
}

export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply)
    if (reply.sent) return

    const user = (request as any).user as JwtPayload
    if (!roles.includes(user.role)) {
      reply.status(403).send({ error: 'Forbidden', message: 'Insufficient permissions' })
    }
  }
}
