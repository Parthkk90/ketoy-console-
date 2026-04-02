import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AuthPage from './pages/AuthPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ScreenEditorPage from './pages/ScreenEditorPage'
import BundleSnapshotsPage from './pages/BundleSnapshotsPage'
import Layout from './components/Layout'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route 
          path="/" 
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:packageName" element={<ProjectDetailPage />} />
          <Route path="projects/:packageName/screens/:screenName" element={<ScreenEditorPage />} />
          <Route path="projects/:packageName/bundles" element={<BundleSnapshotsPage />} />
          <Route path="apps/:packageName/bundles" element={<BundleSnapshotsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
