import { FiCheck, FiX } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { BotaoIcone } from '@/components/botoes'
import "./Notificacao.css"

// Notificação flutuante de sucesso: some sozinha após `duration` ms (pausa com o mouse em cima)
const Notificacao = ({ title, message = "", duration = 5000, onClose }) => {
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
            <BotaoIcone icon={FiX} label="Fechar notificação" onClick={onClose} />
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

Notificacao.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string,
    duration: PropTypes.number,
    onClose: PropTypes.func.isRequired,
}

export default Notificacao
