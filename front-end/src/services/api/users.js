import { request, toQueryString } from './client'
import { deletePhoto, fetchPhoto, uploadPhoto } from './photos'

// Filtros: busca por texto, perfil e situação ("true" / "false"; vazio = todos)
export const fetchUsers = (token, { search, role, active } = {}) =>
    request(`/api/users${toQueryString({ search, role, active })}`, { token })

export const fetchRoles = (token) => request("/api/users/roles", { token })

export const createUser = (token, user) => request("/api/users", { method: "POST", body: user, token })

export const updateUser = (token, id, user) => request(`/api/users/${id}`, { method: "PUT", body: user, token })

export const changeUserStatus = (token, id, active) =>
    request(`/api/users/${id}/status`, { method: "PATCH", body: { active }, token })

export const fetchUserPhoto = (token, id) => fetchPhoto(token, `/api/users/${id}`)
export const uploadUserPhoto = (token, id, file) => uploadPhoto(token, `/api/users/${id}`, file)
export const deleteUserPhoto = (token, id) => deletePhoto(token, `/api/users/${id}`)
