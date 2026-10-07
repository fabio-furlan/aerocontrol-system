import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

// Formato do estado da foto, para validar as props dos componentes que a exibem
export const photoShape = PropTypes.shape({
    status: PropTypes.oneOf(["loading", "ready", "none", "error"]).isRequired,
    url: PropTypes.string,
})

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
