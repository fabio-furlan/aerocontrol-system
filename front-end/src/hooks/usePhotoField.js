import { useState } from 'react'
import { validatePhoto } from '@/utils/photo'
import { usePhoto } from './usePhoto'

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
