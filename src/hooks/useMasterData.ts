import { useState, useEffect, useCallback } from 'react'
import { taskService } from '../services/taskService'

export type MasterEntityType = 'clients' | 'consultants' | 'programmers'

export interface MasterRecord {
  id: string
  name: string
  active: boolean
}

export function useMasterData(entity: MasterEntityType) {
  const [data, setData] = useState<MasterRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let result: MasterRecord[] = []
      if (entity === 'clients') result = await taskService.listClients()
      else if (entity === 'consultants') result = await taskService.listConsultants()
      else result = await taskService.listProgrammers()
      setData(result)
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [entity])

  const create = useCallback(async (name: string) => {
    if (entity === 'clients') await taskService.createClient({ name })
    else if (entity === 'consultants') await taskService.createConsultant({ name })
    else await taskService.createProgrammer({ name })
    await fetchData()
  }, [entity, fetchData])

  const update = useCallback(async (id: string, name: string, active?: boolean) => {
    if (entity === 'clients') await taskService.updateClient(id, { name, active })
    else if (entity === 'consultants') await taskService.updateConsultant(id, { name, active })
    else await taskService.updateProgrammer(id, { name, active })
    await fetchData()
  }, [entity, fetchData])

  const remove = useCallback(async (id: string) => {
    if (entity === 'clients') await taskService.deleteClient(id)
    else if (entity === 'consultants') await taskService.deleteConsultant(id)
    else await taskService.deleteProgrammer(id)
    await fetchData()
  }, [entity, fetchData])

  useEffect(() => { fetchData() }, [fetchData])

  return { data, loading, error, refetch: fetchData, create, update, remove }
}
