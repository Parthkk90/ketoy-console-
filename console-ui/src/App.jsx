import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AuthPage from './pages/AuthPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ScreenEditorPage from './pages/ScreenEditorPage'
import Layout from './components/Layout'

function App() {
  const { developerApiKey } = useAuthStore()

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!developerApiKey ? <AuthPage /> : <Navigate to="/projects" />} />
        <Route 
          path="/" 
          element={developerApiKey ? <Layout /> : <Navigate to="/auth" />}
        >
          <Route index element={<Navigate to="/projects" />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:packageName" element={<ProjectDetailPage />} />
          <Route path="projects/:packageName/screens/:screenName" element={<ScreenEditorPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
