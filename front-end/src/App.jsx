import { useEffect, useState } from 'react'
import './App.css'
import Login from './Components/Login/Login'
import AppShell from './Components/Shell/AppShell'
import { fetchCurrentUser } from './services/api'
import { clearSession, loadSession, saveSession } from './services/session'

function App() {

  // Sessão salva na aba: é revalidada na API antes de ser usada
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(() => loadSession() !== null)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    const saved = loadSession()
    if (!saved) return

    fetchCurrentUser(saved.token)
      .then((user) => {
        const refreshed = { ...saved, user }
        saveSession(refreshed)
        setSession(refreshed)
      })
      .catch(() => clearSession())
      .finally(() => setChecking(false))
  }, [])

  const handleLogin = (newSession) => {
    setNotice("")
    setSession(newSession)
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
  }

  const handleSessionExpired = () => {
    handleLogout()
    setNotice("Sua sessão expirou. Entre novamente para continuar.")
  }

  if (checking) return null

  return (
    <div className="App">
      {session
        ? <AppShell session={session} onLogout={handleLogout} onSessionExpired={handleSessionExpired} />
        : <Login onLogin={handleLogin} notice={notice} />}
    </div>
  )
}

export default App
