import PropTypes from 'prop-types'
import { usePhoto } from '@/hooks/usePhoto'
import "./Foto.css"

// Iniciais do primeiro e do último nome: "Ana Ribeiro" -> "AR"
const initials = (name) => {
    const parts = name.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ""
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
    return (first + last).toUpperCase()
}

// Foto redonda do colaborador; sem foto (ou enquanto carrega), mostra as iniciais
const Avatar = ({ name, hasPhoto, load, onSessionExpired }) => {
    const { photo } = usePhoto(load, hasPhoto, onSessionExpired)

    return (
        <span className='avatar' aria-hidden="true">
            {photo.status === "ready" ? <img src={photo.url} alt="" /> : initials(name)}
        </span>
    )
}

Avatar.propTypes = {
    name: PropTypes.string.isRequired,
    hasPhoto: PropTypes.bool.isRequired,
    load: PropTypes.func.isRequired,
    onSessionExpired: PropTypes.func.isRequired,
}

export default Avatar
