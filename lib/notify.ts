import { prisma } from './prisma'

interface NotifyParams {
  userId:     string   // who receives it
  title:      string
  message:    string
  type:       string   // submitted | approved | rejected
  entityType: string   // paylaw | overtime
  entityId:   string
}

export async function notify(params: NotifyParams) {
  try {
    await prisma.notification.create({
      data: {
        userId:     params.userId,
        title:      params.title,
        message:    params.message,
        type:       params.type,
        entityType: params.entityType,
        entityId:   params.entityId,
      },
    })
  } catch {
    // Never crash the main action
    console.error('Notification failed')
  }
}