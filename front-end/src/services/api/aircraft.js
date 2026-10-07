import { request, toQueryString } from './client'
import { deletePhoto, fetchPhoto, uploadPhoto } from './photos'

// Filtros: busca por texto, base e status (vazio = todos)
export const fetchAircraft = (token, { search, baseCode, status } = {}) =>
    request(`/api/aircraft${toQueryString({ search, baseCode, status })}`, { token })

export const fetchAircraftStatuses = (token) => request("/api/aircraft/statuses", { token })

export const createAircraft = (token, aircraft) => request("/api/aircraft", { method: "POST", body: aircraft, token })

export const updateAircraft = (token, id, aircraft) =>
    request(`/api/aircraft/${id}`, { method: "PUT", body: aircraft, token })

export const fetchAircraftPhoto = (token, id) => fetchPhoto(token, `/api/aircraft/${id}`)
export const uploadAircraftPhoto = (token, id, file) => uploadPhoto(token, `/api/aircraft/${id}`, file)
export const deleteAircraftPhoto = (token, id) => deletePhoto(token, `/api/aircraft/${id}`)
