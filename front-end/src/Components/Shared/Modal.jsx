import { FiX } from 'react-icons/fi'
import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import "./Modal.css"

// Modal com <dialog>: o navegador cuida do foco, do Esc e do fundo escurecido.
// Fecha pelo X, pelo Esc ou clicando fora do conteúdo.
const Modal = ({ title, subtitle, onClose, footer, className, children }) => {
    const dialogRef = useRef(null)

    useEffect(() => {
        const dialog = dialogRef.current
        dialog.showModal()
        return () => dialog.close()
    }, [])

    return (
        // Clique fora do conteúdo (no fundo escurecido) fecha o modal
        <dialog
            ref={dialogRef}
            className={className ? `modal ${className}` : 'modal'}
            aria-labelledby="modal-title"
            onCancel={(e) => { e.preventDefault(); onClose() }}
            onClick={(e) => { if (e.target === dialogRef.current) onClose() }}
        >
            <div className='modal-header'>
                <div>
                    <h2 id="modal-title">{title}</h2>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                <button type="button" className='modal-close' onClick={onClose} aria-label="Fechar">
                    <FiX />
                </button>
            </div>

            <div className='modal-body'>{children}</div>

            {footer && <div className='modal-footer'>{footer}</div>}
        </dialog>
    )
}

Modal.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    footer: PropTypes.node,
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
}

export default Modal
