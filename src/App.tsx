import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { RoleGate } from './components/RoleGate'
import { AdminApprovalQueuePage } from './pages/admin/AdminApprovalQueuePage'
import { AdminBitacoraAprobacionPage } from './pages/admin/AdminBitacoraAprobacionPage'
import { AdminHome } from './pages/admin/AdminHome'
import { AdminInternalRewardsPage } from './pages/admin/AdminInternalRewardsPage'
import { AdminTeacherBudgetPage } from './pages/admin/AdminTeacherBudgetPage'
import { DemoPage } from './pages/DemoPage'
import { HomeRedirect } from './pages/HomeRedirect'
import { LoginPage } from './pages/LoginPage'
import { RegisterStudentPage } from './pages/RegisterStudentPage'
import { StudentHome } from './pages/student/StudentHome'
import { StudentRankingPage } from './pages/student/StudentRankingPage'
import { StudentSubmissionsPage } from './pages/student/StudentSubmissionsPage'
import { StudentTasksPage } from './pages/student/StudentTasksPage'
import { SubmissionDetailPage } from './pages/student/SubmissionDetailPage'
import { SuperHome } from './pages/super/SuperHome'
import { TeacherHome } from './pages/teacher/TeacherHome'
import { TeacherIntegrationsPage } from './pages/teacher/TeacherIntegrationsPage'
import { TeacherGroupsPage } from './pages/teacher/TeacherGroupsPage'
import { TeacherValidationQueuePage } from './pages/teacher/TeacherValidationQueuePage'
import { NgoHome } from './pages/ngo/NgoHome'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterStudentPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomeRedirect />} />
          <Route path="demo" element={<DemoPage />} />
          <Route element={<RoleGate allow={['student']} />}>
            <Route path="student" element={<StudentHome />} />
            <Route path="student/ranking" element={<StudentRankingPage />} />
            <Route path="student/tareas" element={<StudentTasksPage />} />
            <Route path="student/envios" element={<StudentSubmissionsPage />} />
            <Route path="student/submissions/:submissionId" element={<SubmissionDetailPage />} />
          </Route>
          <Route element={<RoleGate allow={['teacher']} />}>
            <Route path="teacher" element={<TeacherHome />} />
            <Route path="teacher/integraciones" element={<TeacherIntegrationsPage />} />
            <Route path="teacher/clases" element={<TeacherGroupsPage />} />
            <Route path="teacher/cola-validacion" element={<TeacherValidationQueuePage />} />
          </Route>
          <Route element={<RoleGate allow={['school_admin']} />}>
            <Route path="admin" element={<AdminHome />} />
            <Route path="admin/presupuesto-docentes" element={<AdminTeacherBudgetPage />} />
            <Route path="admin/recompensas-internas" element={<AdminInternalRewardsPage />} />
            <Route path="admin/cola-aprobacion" element={<AdminApprovalQueuePage />} />
            <Route path="admin/bitacora-aprobacion" element={<AdminBitacoraAprobacionPage />} />
          </Route>
          <Route element={<RoleGate allow={['ngo_admin']} />}>
            <Route path="ngo" element={<NgoHome />} />
          </Route>
          <Route element={<RoleGate allow={['super_admin']} />}>
            <Route path="super" element={<SuperHome />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
