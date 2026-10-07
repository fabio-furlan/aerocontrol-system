// Cliente HTTP da API do FB Aero Control MRO: base de todas as chamadas em services/api.
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
export async function request(path, { method = "GET", body, token, asBlob = false } = {}) {
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

// "?search=abc&status=AOG" a partir dos filtros preenchidos; vazio se não houver nenhum
export const toQueryString = (filters) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
        const text = typeof value === "string" ? value.trim() : value
        if (text !== "" && text !== undefined && text !== null) params.set(key, text)
    })
    const query = params.toString()
    return query ? `?${query}` : ""
}
