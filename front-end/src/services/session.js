// Sessão do usuário: o token fica só na aba atual (sessionStorage).
// "Lembrar usuário" guarda apenas a base e o login (nunca a senha) no localStorage.
const SESSION_KEY = "fbaero.session"
const REMEMBERED_KEY = "fbaero.rememberedUser"

const read = (storage, key) => {
    try {
        const value = storage.getItem(key)
        return value ? JSON.parse(value) : null
    } catch {
        return null
    }
}

const write = (storage, key, value) => {
    try {
        if (value === null) storage.removeItem(key)
        else storage.setItem(key, JSON.stringify(value))
    } catch {
        // Armazenamento indisponível (modo privado, bloqueio do navegador): segue sem persistir
    }
}

export const loadSession = () => {
    const session = read(sessionStorage, SESSION_KEY)
    if (!session?.token || new Date(session.expiresAt) <= new Date()) return null
    return session
}

export const saveSession = (session) => write(sessionStorage, SESSION_KEY, session)

export const clearSession = () => write(sessionStorage, SESSION_KEY, null)

export const loadRememberedUser = () => read(localStorage, REMEMBERED_KEY)

export const saveRememberedUser = (baseCode, login) => write(localStorage, REMEMBERED_KEY, { baseCode, login })

export const clearRememberedUser = () => write(localStorage, REMEMBERED_KEY, null)
