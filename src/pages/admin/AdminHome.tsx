import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { HiLink, HiUserGroup, HiUserPlus } from 'react-icons/hi2'
import { api, ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { ExecutiveHero, KpiStrip, SectionCard } from '../../components/ui/executive'
import { formatCreditsWithUnit, formatId } from '../../i18n/format'

type HistorySummary = {
  transactionCount: number
  creditsTotal: number
}

export function AdminHome() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<HistorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

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
      const s = await api.get<HistorySummary>('/rewards/history/summary', { token })
      setSummary(s)
    } catch (e) {
      setError(e instanceof ApiError ? getApiErrorMessage(e.body) : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

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

  const txCount = summary?.transactionCount ?? 0
  const creditsTotal = summary?.creditsTotal ?? 0

  return (
    <div className="space-y-6">
      <ExecutiveHero
        eyebrow="Panel de administracion"
        title="Control institucional"
        subtitle="Supervisa decisiones finales, gestiona talento escolar y monitorea el flujo de Credit hacia las cuentas estudiantiles."
      />
      <KpiStrip
        items={[
          { label: 'Cola aprobacion', value: 'Ver modulo', hint: 'Seccion dedicada en sidebar' },
          {
            label: 'Movimientos',
            value: formatId(txCount),
            hint: 'Transacciones en la bitácora de aprobación',
          },
          {
            label: 'Créditos acumulados',
            value: formatCreditsWithUnit(creditsTotal),
            hint: 'Total de Credit publicado en la institución',
          },
        ]}
      />

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-info text-sm">{msg}</div>}


      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <SectionCard
          title="Alta de usuario"
          subtitle="Incorpora nuevos perfiles operativos dentro de tu institucion."
          titleIcon={<HiUserPlus aria-hidden />}
        >
          <form className="mt-2 grid  gap-4" onSubmit={provisionUser}>
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
        </SectionCard>

        <SectionCard
          title="Reasignar rol"
          subtitle="Ajusta la responsabilidad operativa manteniendo control institucional."
          titleIcon={<HiUserGroup aria-hidden />}
        >
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
        </SectionCard>

      </div>

      <SectionCard
        title="Asociar docente y estudiante"
        subtitle="Define la supervision academica para un seguimiento mas preciso."
        titleIcon={<HiLink aria-hidden />}
      >
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
      </SectionCard>
    </div>
  )
}
