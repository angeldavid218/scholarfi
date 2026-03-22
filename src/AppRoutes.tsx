import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RoleProvider } from './context/RoleProvider.tsx'
import { AppLayout } from './layouts/AppLayout.tsx'
import { LandingPage } from './pages/LandingPage.tsx'
import { StudentDashboard } from './pages/StudentDashboard.tsx'
import { TeacherDashboard } from './pages/TeacherDashboard.tsx'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </RoleProvider>
    </BrowserRouter>
  )
}
