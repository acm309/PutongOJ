import { useToast } from 'primevue'

const group = 'global'
const life = 3000

export function useMessage () {
  const toast = useToast()

  return {
    success (summary: string, detail?: string) {
      toast.add({ severity: 'success', summary, detail, group, life })
    },
    info (summary: string, detail?: string) {
      toast.add({ severity: 'info', summary, detail, group, life })
    },
    warn (summary: string, detail?: string) {
      toast.add({ severity: 'warn', summary, detail, group, life })
    },
    error (summary: string, detail?: string) {
      toast.add({ severity: 'error', summary, detail, group, life })
    },
  }
}
