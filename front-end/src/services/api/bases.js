import { request } from './client'

// Lista pública das bases ativas (usada também na tela de login, antes de haver token)
export const fetchBases = () => request("/api/bases")
