// Regras da foto (aeronaves e colaboradores): as mesmas conferidas pela API
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const PHOTO_HINT = "JPG, PNG ou WEBP, até 5 MB."

// Retorna a mensagem de erro, ou null se a foto puder ser enviada
export const validatePhoto = (file) => {
    if (!PHOTO_TYPES.includes(file.type)) return "Formato não suportado. Envie uma foto JPG, PNG ou WEBP."
    if (file.size > MAX_PHOTO_BYTES) return "A foto deve ter até 5 MB."
    return null
}
