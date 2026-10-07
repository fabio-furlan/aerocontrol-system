import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout'
import PaginaLogin from '@/pages/login/PaginaLogin'
import { fetchCurrentUser } from '@/services/api'
import { clearSession, loadSession, saveSession } from '@/services/session'

// Raiz da aplicação: decide entre a tela de login e a área logada, conforme a sessão.
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

  return session
    ? <AppShell session={session} onLogout={handleLogout} onSessionExpired={handleSessionExpired} />
    : <PaginaLogin onLogin={handleLogin} notice={notice} />
}

export default App
