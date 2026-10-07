import { request } from './client'

export const login = ({ baseCode, login: user, password }) =>
    request("/api/auth/login", { method: "POST", body: { baseCode, login: user, password } })

export const fetchCurrentUser = (token) => request("/api/auth/me", { token })
