import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { isAuthenticated } from './lib/auth'

// Public pages
import JobBoard from './pages/public/JobBoard'
import JobDetail from './pages/public/JobDetail'
import ApplyForm from './pages/public/ApplyForm'

// ATS pages (lazy loaded)
const Login = lazy(() => import('./pages/ats/Login'))
const Dashboard = lazy(() => import('./pages/ats/Dashboard'))
const JobList = lazy(() => import('./pages/ats/jobs/JobList'))
const JobCreate = lazy(() => import('./pages/ats/jobs/JobCreate'))
const JobEdit = lazy(() => import('./pages/ats/jobs/JobEdit'))
const JobView = lazy(() => import('./pages/ats/jobs/JobView'))
const CandidateList = lazy(() => import('./pages/ats/candidates/CandidateList'))
const CandidateProfile = lazy(() => import('./pages/ats/candidates/CandidateProfile'))
const Analytics = lazy(() => import('./pages/ats/Analytics'))
const Users = lazy(() => import('./pages/ats/settings/Users'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/ats/login" replace />
  }
  return <>{children}</>
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Job Board */}
          <Route path="/" element={<JobBoard />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/:id/apply" element={<ApplyForm />} />

          {/* ATS */}
          <Route
            path="/ats/login"
            element={isAuthenticated() ? <Navigate to="/ats" replace /> : <Login />}
          />
          <Route
            path="/ats"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/ats/jobs"
            element={
              <RequireAuth>
                <JobList />
              </RequireAuth>
            }
          />
          <Route
            path="/ats/jobs/new"
            element={
              <RequireAuth>
                <JobCreate />
              </RequireAuth>
            }
          />
          <Route
            path="/ats/jobs/:id/edit"
            element={
              <RequireAuth>
                <JobEdit />
              </RequireAuth>
            }
          />
          <Route
            path="/ats/jobs/:id"
            element={
              <RequireAuth>
                <JobView />
              </RequireAuth>
            }
          />
          <Route
            path="/ats/candidates"
            element={
              <RequireAuth>
                <CandidateList />
              </RequireAuth>
            }
          />
          <Route
            path="/ats/applications/:id"
            element={
              <RequireAuth>
                <CandidateProfile />
              </RequireAuth>
            }
          />
          <Route
            path="/ats/analytics"
            element={
              <RequireAuth>
                <Analytics />
              </RequireAuth>
            }
          />
          <Route
            path="/ats/settings/users"
            element={
              <RequireAuth>
                <Users />
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
