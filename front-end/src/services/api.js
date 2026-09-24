// Cliente HTTP da API do FB Aero Control MRO.
// Em produção, defina VITE_API_URL com o endereço público da API.
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8081").replace(/\/$/, "")

export class ApiError extends Error {
    constructor(status, message, fields = null) {
        super(message)
        this.status = status
        this.fields = fields
    }
}

async function request(path, { method = "GET", body, token } = {}) {
    const headers = {}
    if (body !== undefined) headers["Content-Type"] = "application/json"
    if (token) headers.Authorization = `Bearer ${token}`

    let response
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })
    } catch {
        throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.")
    }

    const data = await response.json().catch(() => null)
    if (!response.ok) {
        throw new ApiError(
            response.status,
            data?.message ?? "Erro inesperado. Tente novamente em instantes.",
            data?.fields ?? null,
        )
    }
    return data
}

export const fetchBases = () => request("/api/bases")

export const login = ({ baseCode, login, password }) =>
    request("/api/auth/login", { method: "POST", body: { baseCode, login, password } })

export const fetchCurrentUser = (token) => request("/api/auth/me", { token })
