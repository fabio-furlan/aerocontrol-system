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

// body: objeto (enviado como JSON) ou FormData (upload de arquivo).
// asBlob: devolve o conteúdo binário (ex.: imagem) em vez de JSON.
async function request(path, { method = "GET", body, token, asBlob = false } = {}) {
    const isForm = body instanceof FormData
    const headers = {}
    if (body !== undefined && !isForm) headers["Content-Type"] = "application/json"
    if (token) headers.Authorization = `Bearer ${token}`

    let response
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body === undefined || isForm ? body : JSON.stringify(body),
        })
    } catch {
        throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.")
    }

    if (asBlob && response.ok) return response.blob()

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

// ---- Cadastro de usuários ----

export const fetchUsers = (token, { search, role, active } = {}) => {
    const params = new URLSearchParams()
    if (search?.trim()) params.set("search", search.trim())
    if (role) params.set("role", role)
    if (active !== "" && active !== undefined) params.set("active", active)
    const query = params.toString()
    return request(`/api/users${query ? `?${query}` : ""}`, { token })
}

export const fetchRoles = (token) => request("/api/users/roles", { token })

export const createUser = (token, user) => request("/api/users", { method: "POST", body: user, token })

export const updateUser = (token, id, user) => request(`/api/users/${id}`, { method: "PUT", body: user, token })

export const changeUserStatus = (token, id, active) =>
    request(`/api/users/${id}/status`, { method: "PATCH", body: { active }, token })

// ---- Cadastro de aeronaves ----

export const fetchAircraft = (token, { search, baseCode, status } = {}) => {
    const params = new URLSearchParams()
    if (search?.trim()) params.set("search", search.trim())
    if (baseCode) params.set("baseCode", baseCode)
    if (status) params.set("status", status)
    const query = params.toString()
    return request(`/api/aircraft${query ? `?${query}` : ""}`, { token })
}

export const fetchAircraftStatuses = (token) => request("/api/aircraft/statuses", { token })

export const createAircraft = (token, aircraft) => request("/api/aircraft", { method: "POST", body: aircraft, token })

export const updateAircraft = (token, id, aircraft) =>
    request(`/api/aircraft/${id}`, { method: "PUT", body: aircraft, token })

// ---- Fotos (aeronaves e colaboradores) ----
// A foto exige o token, por isso é baixada como arquivo (e não usada direto no <img src>)

const fetchPhoto = (token, path) => request(`${path}/photo`, { token, asBlob: true })

const uploadPhoto = (token, path, file) => {
    const form = new FormData()
    form.append("file", file)
    return request(`${path}/photo`, { method: "PUT", body: form, token })
}

const deletePhoto = (token, path) => request(`${path}/photo`, { method: "DELETE", token })

export const fetchAircraftPhoto = (token, id) => fetchPhoto(token, `/api/aircraft/${id}`)
export const uploadAircraftPhoto = (token, id, file) => uploadPhoto(token, `/api/aircraft/${id}`, file)
export const deleteAircraftPhoto = (token, id) => deletePhoto(token, `/api/aircraft/${id}`)

export const fetchUserPhoto = (token, id) => fetchPhoto(token, `/api/users/${id}`)
export const uploadUserPhoto = (token, id, file) => uploadPhoto(token, `/api/users/${id}`, file)
export const deleteUserPhoto = (token, id) => deletePhoto(token, `/api/users/${id}`)
