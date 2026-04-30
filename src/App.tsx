import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { RoleGate } from './components/RoleGate'
import { AdminHome } from './pages/admin/AdminHome'
import { DemoPage } from './pages/DemoPage'
import { HomeRedirect } from './pages/HomeRedirect'
import { LoginPage } from './pages/LoginPage'
import { StudentHome } from './pages/student/StudentHome'
import { SubmissionDetailPage } from './pages/student/SubmissionDetailPage'
import { SuperHome } from './pages/super/SuperHome'
import { TeacherHome } from './pages/teacher/TeacherHome'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomeRedirect />} />
          <Route element={<RoleGate allow={['student']} />}>
            <Route path="student" element={<StudentHome />} />
            <Route path="student/submissions/:submissionId" element={<SubmissionDetailPage />} />
          </Route>
          <Route element={<RoleGate allow={['teacher']} />}>
            <Route path="teacher" element={<TeacherHome />} />
          </Route>
          <Route element={<RoleGate allow={['school_admin']} />}>
            <Route path="admin" element={<AdminHome />} />
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
