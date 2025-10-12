import { useToast } from 'primevue'

const group = 'global'

export type MessageService = ReturnType<typeof useMessage>

export function useMessage () {
  const toast = useToast()

  return {
    success (summary: string, detail?: string) {
      toast.add({ severity: 'success', summary, detail, group, life: 3000 })
    },
    info (summary: string, detail?: string) {
      toast.add({ severity: 'info', summary, detail, group, life: 5000 })
    },
    warn (summary: string, detail?: string) {
      toast.add({ severity: 'warn', summary, detail, group, life: 7000 })
    },
    error (summary: string, detail?: string) {
      toast.add({ severity: 'error', summary, detail, group, life: 9000 })
    },
  }
}
