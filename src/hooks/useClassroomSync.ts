import { useState } from 'react'
import { api, ApiError, getApiErrorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export interface ClassroomSyncResult {
  rewarded: number
  skippedLowGrade: number
  skippedNoGrade: number
  skippedAlreadyRewarded: number
  skippedBudgetExhausted: number
  budgetRemaining: number
}

interface ClassroomSyncEnqueue {
  runId: number
  taskId: number
  status: string
  deduped?: boolean
}

interface ClassroomSyncAllEnqueue {
  tasks: number
  runs: ClassroomSyncEnqueue[]
}

interface ClassroomSyncRun {
  runId: number
  taskId: number
  status: 'queued' | 'running' | 'completed' | 'failed' | string
  result: ClassroomSyncResult | null
  errorMessage: string | null
}

interface ClassroomStudentSyncSummary {
  courses: number
  created: number
  activated: number
  linked: number
  skipped: number
  errors: Array<{ email: string | null; message: string }>
}

const SYNC_POLL_MS = 1000
const SYNC_POLL_TIMEOUT_MS = 180_000

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const summarizeSyncResult = (result: ClassroomSyncResult): string => {
  const skippedTotal =
    result.skippedLowGrade +
    result.skippedNoGrade +
    result.skippedAlreadyRewarded +
    result.skippedBudgetExhausted
  return `${result.rewarded} recompensa(s) emitida(s), ${skippedTotal} omitida(s). Presupuesto restante: ${result.budgetRemaining}.`
}

interface UseClassroomSyncOptions {
  onSynced: (options?: { silent?: boolean }) => Promise<void>
}

export const useClassroomSync = ({ onSynced }: UseClassroomSyncOptions) => {
  const { token } = useAuth()
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [actionMsgTone, setActionMsgTone] = useState<'info' | 'success' | 'error'>('info')
  const [syncingTaskId, setSyncingTaskId] = useState<number | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)
  const [syncingStudents, setSyncingStudents] = useState(false)

  const busy = syncingTaskId != null || syncingAll || syncingStudents

  const pollClassroomSyncRun = async (runId: number): Promise<ClassroomSyncRun> => {
    if (!token) throw new Error('No autenticado')
    const started = Date.now()
    while (Date.now() - started < SYNC_POLL_TIMEOUT_MS) {
      const run = await api.get<ClassroomSyncRun>(`/classroom-sync-runs/${runId}`, { token })
      if (run.status === 'completed' || run.status === 'failed') return run
      await sleep(SYNC_POLL_MS)
    }
    throw new Error('La sincronizacion tardo demasiado. Revisa el worker (`npm run queue:work`).')
  }

  const postClassroomSync = async (id: number): Promise<ClassroomSyncResult> => {
    if (!token) throw new Error('No autenticado')
    const enqueued = await api.post<ClassroomSyncEnqueue>(`/tasks/${id}/sync-classroom`, {
      json: {},
      token,
    })
    const run = await pollClassroomSyncRun(enqueued.runId)
    if (run.status === 'failed') {
      throw new Error(run.errorMessage || 'No se pudo sincronizar con Classroom')
    }
    if (!run.result) throw new Error('Sincronizacion completada sin resultado')
    return run.result
  }

  const syncClassroomTask = async (id: number) => {
    if (!token || busy) return
    setSyncingTaskId(id)
    setActionMsg(null)
    setActionMsgTone('info')
    try {
      const result = await postClassroomSync(id)
      setActionMsgTone(result.rewarded > 0 ? 'success' : 'info')
      setActionMsg(`Sincronizacion completada: ${summarizeSyncResult(result)}`)
      await onSynced({ silent: true })
    } catch (err) {
      setActionMsgTone('error')
      setActionMsg(
        err instanceof ApiError
          ? getApiErrorMessage(err.body)
          : err instanceof Error
            ? err.message
            : 'No se pudo sincronizar con Classroom'
      )
    } finally {
      setSyncingTaskId(null)
    }
  }

  const syncAllClassroomTasks = async () => {
    if (!token || busy) return
    setSyncingAll(true)
    setActionMsg(null)
    setActionMsgTone('info')
    try {
      const enqueued = await api.post<ClassroomSyncAllEnqueue>(
        '/integrations/google-classroom/sync-all',
        { json: {}, token }
      )
      if (enqueued.tasks === 0) {
        setActionMsgTone('info')
        setActionMsg('No hay tareas activas de Google Classroom para sincronizar.')
        return
      }
      if (enqueued.runs.length === 0) {
        setActionMsgTone('error')
        setActionMsg('No se pudo sincronizar ninguna tarea con Classroom.')
        return
      }

      const polls = await Promise.all(
        enqueued.runs.map(async (job) => {
          try {
            return await pollClassroomSyncRun(job.runId)
          } catch {
            return { status: 'pending' as const }
          }
        })
      )

      let rewardedTotal = 0
      let skippedTotal = 0
      let lastBudgetRemaining: number | null = null
      let failed = enqueued.tasks - enqueued.runs.length
      let pending = 0

      for (const run of polls) {
        if (run.status === 'pending') {
          pending += 1
          continue
        }
        if (run.status !== 'completed' || !('result' in run) || !run.result) {
          failed += 1
          continue
        }
        rewardedTotal += run.result.rewarded
        skippedTotal +=
          run.result.skippedLowGrade +
          run.result.skippedNoGrade +
          run.result.skippedAlreadyRewarded +
          run.result.skippedBudgetExhausted
        lastBudgetRemaining = run.result.budgetRemaining
      }

      const total = enqueued.tasks
      const ok = total - failed - pending
      const budgetPart =
        lastBudgetRemaining != null ? ` Presupuesto restante: ${lastBudgetRemaining}.` : ''
      const pendingPart =
        pending > 0 ? ` ${pending} sigue(n) en segundo plano; recarga mas tarde.` : ''

      if (failed === total) {
        setActionMsgTone('error')
        setActionMsg('No se pudo sincronizar ninguna tarea con Classroom.')
      } else {
        setActionMsgTone(rewardedTotal > 0 ? 'success' : failed > 0 ? 'error' : 'info')
        setActionMsg(
          `Sincronizacion masiva: ${ok}/${total} tarea(s) OK. ${rewardedTotal} recompensa(s), ${skippedTotal} omitida(s).${budgetPart}${pendingPart}`
        )
      }
      await onSynced({ silent: true })
    } catch (err) {
      setActionMsgTone('error')
      setActionMsg(
        err instanceof ApiError
          ? getApiErrorMessage(err.body)
          : err instanceof Error
            ? err.message
            : 'No se pudo sincronizar con Classroom'
      )
    } finally {
      setSyncingAll(false)
    }
  }

  const syncClassroomStudents = async () => {
    if (!token || busy) return
    setSyncingStudents(true)
    setActionMsg(null)
    setActionMsgTone('info')
    try {
      const summary = await api.post<ClassroomStudentSyncSummary>(
        '/integrations/google-classroom/sync-students',
        { json: {}, token }
      )
      const createdPart = summary.created > 0 ? `${summary.created} creado(s)` : null
      const activatedPart = summary.activated > 0 ? `${summary.activated} activado(s)` : null
      const linkedPart = `${summary.linked} vinculado(s)`
      const parts = [createdPart, activatedPart, linkedPart].filter(Boolean).join(', ')
      setActionMsgTone(summary.created + summary.activated > 0 ? 'success' : 'info')
      setActionMsg(
        `Estudiantes sincronizados (${summary.courses} curso(s)): ${parts}.${
          summary.skipped > 0 ? ` ${summary.skipped} omitido(s).` : ''
        }`
      )
    } catch (err) {
      setActionMsgTone('error')
      setActionMsg(
        err instanceof ApiError
          ? getApiErrorMessage(err.body)
          : 'No se pudo sincronizar estudiantes de Classroom'
      )
    } finally {
      setSyncingStudents(false)
    }
  }

  return {
    actionMsg,
    actionMsgTone,
    setActionMsg,
    syncingTaskId,
    syncingAll,
    syncingStudents,
    busy,
    syncClassroomTask,
    syncAllClassroomTasks,
    syncClassroomStudents,
  }
}
