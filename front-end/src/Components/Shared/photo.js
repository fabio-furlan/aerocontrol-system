import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

// Regras da foto (aeronaves e colaboradores): as mesmas conferidas pela API
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const PHOTO_HINT = "JPG, PNG ou WEBP, até 5 MB."

export const photoShape = PropTypes.shape({
    status: PropTypes.oneOf(["loading", "ready", "none", "error"]).isRequired,
    url: PropTypes.string,
})

// Retorna a mensagem de erro, ou null se a foto puder ser enviada
export const validatePhoto = (file) => {
    if (!PHOTO_TYPES.includes(file.type)) return "Formato não suportado. Envie uma foto JPG, PNG ou WEBP."
    if (file.size > MAX_PHOTO_BYTES) return "A foto deve ter até 5 MB."
    return null
}

// Foto exibida na tela: { status: "loading" | "ready" | "none" | "error", url }.
// load: função que baixa a foto salva (só é chamada se hasPhoto). Libera a imagem da memória ao trocar ou sair.
export const usePhoto = (load, hasPhoto, onSessionExpired) => {
    const [photo, setPhoto] = useState({ status: hasPhoto ? "loading" : "none", url: null })

    useEffect(() => () => { if (photo.url) URL.revokeObjectURL(photo.url) }, [photo.url])

    useEffect(() => {
        if (!hasPhoto) return undefined
        let cancelled = false
        load()
            .then((blob) => {
                if (!cancelled) setPhoto({ status: "ready", url: URL.createObjectURL(blob) })
            })
            .catch((error) => {
                if (cancelled) return
                if (error.status === 401) onSessionExpired()
                else setPhoto({ status: error.status === 404 ? "none" : "error", url: null })
            })
        return () => { cancelled = true }
        // A foto salva é carregada uma vez ao abrir; depois é atualizada localmente
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const showFile = (file) => setPhoto({ status: "ready", url: URL.createObjectURL(file) })
    const clear = () => setPhoto({ status: "none", url: null })

    return { photo, showFile, clear }
}

// Foto num formulário: a escolhida só é enviada (ou a atual removida) depois de salvar os dados.
export const usePhotoField = (load, hasPhoto, onSessionExpired) => {
    const { photo, showFile, clear } = usePhoto(load, hasPhoto, onSessionExpired)
    const [change, setChange] = useState(null)   // null | { file } | { remove: true }
    const [error, setError] = useState(null)

    const select = (file) => {
        const invalid = validatePhoto(file)
        setError(invalid)
        if (invalid) return
        showFile(file)
        setChange({ file })
    }

    const remove = () => {
        clear()
        setError(null)
        // Foto só escolhida e ainda não enviada: basta descartá-la
        setChange(hasPhoto ? { remove: true } : null)
    }

    // Chamado após salvar os dados. Devolve o registro atualizado e a mensagem de erro da foto, se houver.
    // Sessão expirada (401) é repassada para quem chamou.
    const apply = async (saved, { upload, remove: removeSaved }) => {
        if (!change) return { saved, photoError: null }
        try {
            const updated = change.file ? await upload(saved.id, change.file) : await removeSaved(saved.id)
            return { saved: updated, photoError: null }
        } catch (e) {
            if (e.status === 401) throw e
            return { saved, photoError: e.message }
        }
    }

    return { photo, pending: change !== null, error, select, remove, apply }
}
