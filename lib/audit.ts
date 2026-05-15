import { prisma } from './prisma'

interface LogParams {
  action:     string   // 'created' | 'updated' | 'deleted' | 'approved' | 'rejected' | 'submitted'
  entityType: string   // 'paylaw' | 'overtime' | 'employee'
  entityId:   string
  entityName: string   // human readable name
  userId:     string   // who did the action
  userName:   string
  userRole:   string
  adminId:    string   // the company account this belongs to
  details?:   string   // optional extra context
}

export async function logAction(params: LogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        action:     params.action,
        entityType: params.entityType,
        entityId:   params.entityId,
        entityName: params.entityName,
        userId:     params.userId,
        userName:   params.userName,
        userRole:   params.userRole,
        adminId:    params.adminId,
        details:    params.details || null,
      },
    })
  } catch {
    // Audit logging should never crash the main action
    // so we silently ignore errors here
    console.error('Audit log failed — continuing anyway')
  }
}