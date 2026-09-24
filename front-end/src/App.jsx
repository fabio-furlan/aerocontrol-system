import { useEffect, useState } from 'react'
import './App.css'
import Login from './Components/Login/Login'
import Home from './Components/Home/Home'
import { fetchCurrentUser } from './services/api'
import { clearSession, loadSession, saveSession } from './services/session'

function App() {

  // Sessão salva na aba: é revalidada na API antes de ser usada
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(() => loadSession() !== null)

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

  const handleLogout = () => {
    clearSession()
    setSession(null)
  }

  if (checking) return null

  return (
    <div className="App">
      {session
        ? <Home user={session.user} onLogout={handleLogout} />
        : <Login onLogin={setSession} />}
    </div>
  )
}

export default App
