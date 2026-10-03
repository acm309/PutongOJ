import type { NotificationSeverity } from '@putong-oj/shared'
import { useToast } from 'primevue/usetoast'

const group = 'global'

export type MessageSeverity = NotificationSeverity
export type MessageLife = number | null

const defaultLife: Record<MessageSeverity, number> = {
  success: 3000,
  info: 5000,
  warn: 10000,
  error: 15000,
}

export type MessageService = ReturnType<typeof useMessage>

export function useMessage () {
  const toast = useToast()

  function add (severity: MessageSeverity, summary: string, detail?: string, life?: MessageLife) {
    const duration = life === undefined ? defaultLife[severity] : life
    toast.add({
      severity,
      summary,
      detail,
      group,
      ...(duration === null ? {} : { life: duration }),
    })
  }

  return {
    success (summary: string, detail?: string, life?: MessageLife) {
      add('success', summary, detail, life)
    },
    info (summary: string, detail?: string, life?: MessageLife) {
      add('info', summary, detail, life)
    },
    warn (summary: string, detail?: string, life?: MessageLife) {
      add('warn', summary, detail, life)
    },
    error (summary: string, detail?: string, life?: MessageLife) {
      add('error', summary, detail, life)
    },
    notify (severity: MessageSeverity, summary: string, detail?: string, life?: MessageLife) {
      add(severity, summary, detail, life)
    },
  }
}
