import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { formatAmount, formatId } from '../../i18n/format'

type QueueRow = {
  id: number
  taskId: number
  taskTitle: string
  studentId: number
  evidenceText: string | null
  evidenceUrl: string | null
  status: string
  statusLabelEs: string
  submittedAt: string
}

type RewardRow = {
  id: number
  submissionId: number
  studentId: number
  amount: number
  postedAt: string | null
}

function formatRelativeDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diffMs = date.getTime() - Date.now()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  if (Math.abs(diffMs) < hour) return rtf.format(Math.round(diffMs / minute), 'minute')
  if (Math.abs(diffMs) < day) return rtf.format(Math.round(diffMs / hour), 'hour')
  return rtf.format(Math.round(diffMs / day), 'day')
}

function statusBadgeClass(status: string): string {
  if (status === 'validated') return 'badge badge-info badge-sm'
  if (status === 'approved') return 'badge badge-success badge-sm'
  if (status === 'rejected_by_admin' || status === 'rejected_by_teacher') return 'badge badge-error badge-sm'
  return 'badge badge-ghost badge-sm'
}

export function AdminHome() {
  const { token } = useAuth()
  const [queue, setQueue] = useState<QueueRow[]>([])
  const [history, setHistory] = useState<RewardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('student')

  const [assignUserId, setAssignUserId] = useState('')
  const [assignRole, setAssignRole] = useState<'teacher' | 'student' | 'school_admin'>('teacher')

  const [teacherId, setTeacherId] = useState('')
  const [studentId, setStudentId] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const [q, h] = await Promise.all([
        api.get<QueueRow[]>('/submissions/admin-queue', { token }),
        api.get<RewardRow[]>('/rewards/history', { token }),
      ])
      setQueue(Array.isArray(q) ? q : [])
      setHistory(Array.isArray(h) ? h : [])
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  async function approve(id: number) {
    if (!token) return
    setMsg(null)
    try {
      await api.patch(`/submissions/${id}/admin-decision`, {
        json: { decision: 'approve' },
        token,
      })
      setMsg(`Envio ${id} aprobado (recompensa registrada si aplica).`)
      await load()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function submitReject(e: FormEvent) {
    e.preventDefault()
    if (!token || rejectId === null) return
    setMsg(null)
    try {
      await api.patch(`/submissions/${rejectId}/admin-decision`, {
        json: { decision: 'reject', reason: rejectReason.trim() },
        token,
      })
      setMsg(`Envio ${rejectId} rechazado por administracion.`)
      setRejectId(null)
      setRejectReason('')
      await load()
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function provisionUser(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    try {
      await api.post('/institutions/users', {
        json: {
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
        },
        token,
      })
      setMsg('Usuario creado.')
      setFullName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function assignRoleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    const uid = Number(assignUserId)
    if (!Number.isInteger(uid) || uid <= 0) {
      setMsg('ID de usuario invalido')
      return
    }
    try {
      await api.patch(`/institutions/users/${uid}/role`, { json: { role: assignRole }, token })
      setMsg(`Rol actualizado para usuario ${uid}.`)
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  async function linkTeacherStudent(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setMsg(null)
    const tid = Number(teacherId)
    const sid = Number(studentId)
    if (!Number.isInteger(tid) || !Number.isInteger(sid)) {
      setMsg('IDs invalidos')
      return
    }
    try {
      await api.post('/institutions/teacher-students', {
        json: { teacherId: tid, studentId: sid },
        token,
      })
      setMsg('Asociacion docente-estudiante guardada.')
      setTeacherId('')
      setStudentId('')
    } catch (err) {
      setMsg(err instanceof ApiError ? getApiErrorMessage(err.body) : 'Error')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-md loading-spinner text-primary" aria-label="Cargando" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Administracion escolar</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-info text-sm">{msg}</div>}

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Cola de aprobacion</h2>
          {queue.length === 0 ? (
            <p className="text-base-content/70">Sin envios validados pendientes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tarea</th>
                    <th>Estudiante</th>
                    <th>Estado</th>
                    <th>Evidencia</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {queue.map((s) => (
                    <tr key={s.id}>
                      <th>{formatId(s.id)}</th>
                      <td>{s.taskTitle}</td>
                      <td>{formatId(s.studentId)}</td>
                      <td>
                        <span className={statusBadgeClass(s.status)}>{s.statusLabelEs}</span>
                      </td>
                      <td className="max-w-xs align-top text-xs">
                        {s.evidenceText ? (
                          <p className="line-clamp-3 whitespace-pre-wrap break-words">{s.evidenceText}</p>
                        ) : null}
                        {s.evidenceUrl ? (
                          <a
                            href={s.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-primary block truncate pt-1"
                          >
                            Enlace
                          </a>
                        ) : null}
                        {!s.evidenceText && !s.evidenceUrl ? <span className="text-base-content/50">—</span> : null}
                      </td>
                      <td className="flex flex-wrap gap-1">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => approve(s.id)}>
                          Aprobar
                        </button>
                        <button type="button" className="btn btn-outline btn-error btn-sm" onClick={() => setRejectId(s.id)}>
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {rejectId !== null && (
        <section className="card border border-error/30 bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg text-error">Rechazo admin (envio #{rejectId})</h2>
            <form className="mt-2 flex max-w-xl flex-col gap-4" onSubmit={submitReject}>
              <label className="form-control w-full">
                <div className="label pt-0">
                  <span className="label-text">Razon</span>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  minLength={2}
                  rows={3}
                  className="textarea textarea-bordered w-full"
                />
              </label>
              <div className="card-actions justify-end gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => setRejectId(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-error">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Alta de usuario</h2>
          <form className="mt-2 grid max-w-xl gap-4" onSubmit={provisionUser}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Nombre</span>
              </div>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Correo</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Contrasena</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Rol</span>
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
                className="select select-bordered w-full"
              >
                <option value="student">Estudiante</option>
                <option value="teacher">Docente</option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary w-fit">
              Crear
            </button>
          </form>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Reasignar rol</h2>
          <p className="text-sm text-base-content/70">Reemplaza los roles del usuario.</p>
          <form className="mt-2 grid max-w-xl gap-4" onSubmit={assignRoleSubmit}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">ID usuario</span>
              </div>
              <input
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">Rol</span>
              </div>
              <select
                value={assignRole}
                onChange={(e) =>
                  setAssignRole(e.target.value as 'teacher' | 'student' | 'school_admin')
                }
                className="select select-bordered w-full"
              >
                <option value="student">Estudiante</option>
                <option value="teacher">Docente</option>
                <option value="school_admin">Admin escolar</option>
              </select>
            </label>
            <button type="submit" className="btn btn-outline btn-primary w-fit">
              Guardar
            </button>
          </form>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Asociar docente y estudiante</h2>
          <form className="mt-2 grid max-w-xl gap-4" onSubmit={linkTeacherStudent}>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">ID docente</span>
              </div>
              <input
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label pt-0">
                <span className="label-text">ID estudiante</span>
              </div>
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <button type="submit" className="btn btn-outline w-fit">
              Guardar
            </button>
          </form>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="card-title text-lg">Historial de recompensas</h2>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => load()}>
              Actualizar
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-base-content/70">Sin movimientos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Envio</th>
                    <th>Estudiante</th>
                    <th>Monto</th>
                    <th>Publicado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.id}>
                      <th>{formatId(r.id)}</th>
                      <td>{formatId(r.submissionId)}</td>
                      <td>{formatId(r.studentId)}</td>
                      <td className="font-medium tabular-nums text-secondary">{formatAmount(r.amount)}</td>
                      <td className="text-xs text-base-content/70">
                        <span title={r.postedAt ?? undefined}>{formatRelativeDate(r.postedAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
