import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AuditParams {
  entityType: string
  entityId: string
  action: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  performedById?: string
  ipAddress?: string
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
      newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      performedById: params.performedById,
      ipAddress: params.ipAddress,
    },
  })
}
