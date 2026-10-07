import { request } from './client'

// Foto de um registro (aeronave ou colaborador). A foto exige o token,
// por isso é baixada como arquivo (e não usada direto no <img src>).
export const fetchPhoto = (token, path) => request(`${path}/photo`, { token, asBlob: true })

export const uploadPhoto = (token, path, file) => {
    const form = new FormData()
    form.append("file", file)
    return request(`${path}/photo`, { method: "PUT", body: form, token })
}

export const deletePhoto = (token, path) => request(`${path}/photo`, { method: "DELETE", token })
