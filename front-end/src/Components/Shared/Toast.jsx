import { FiCheck, FiX } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import "./Toast.css"

// Notificação flutuante de sucesso: some sozinha após `duration` ms (pausa com o mouse em cima)
const Toast = ({ title, message = "", duration = 5000, onClose }) => {
    const [paused, setPaused] = useState(false)

    useEffect(() => {
        if (paused) return undefined
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [paused, duration, onClose])

    return (
        <div
            className='toast'
            role="status"
            aria-live="polite"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <span className='toast-icon' aria-hidden="true"><FiCheck /></span>
            <div className='toast-text'>
                <strong>{title}</strong>
                {message && <p>{message}</p>}
            </div>
            <button type="button" className='toast-close' onClick={onClose} aria-label="Fechar notificação">
                <FiX />
            </button>
            {/* Barra com o tempo restante; reinicia ao tirar o mouse */}
            <span
                key={paused ? "paused" : "running"}
                className={`toast-progress ${paused ? "is-paused" : ""}`}
                style={{ animationDuration: `${duration}ms` }}
                aria-hidden="true"
            />
        </div>
    )
}

Toast.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string,
    duration: PropTypes.number,
    onClose: PropTypes.func.isRequired,
}

export default Toast
