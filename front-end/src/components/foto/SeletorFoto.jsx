import { FiImage, FiTrash2, FiUpload } from 'react-icons/fi'
import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { photoShape } from '@/hooks/usePhoto'
import { PHOTO_HINT, PHOTO_TYPES } from '@/utils/photo'
import { Botao } from '@/components/botoes'
import MolduraFoto from './MolduraFoto'
import "./Foto.css"

// Campo de foto dos formulários. Sem foto, a área inteira escolhe (ou recebe arrastada) a imagem;
// com foto, Trocar e Remover ficam sobre a imagem.
const SeletorFoto = ({ id, label, photo, alt, pending, error, disabled, onSelect, onRemove }) => {
    const fileRef = useRef(null)
    const [dragging, setDragging] = useState(false)

    const choose = (event) => {
        const file = event.target.files[0]
        event.target.value = ""
        if (file) onSelect(file)
    }

    const drop = (event) => {
        event.preventDefault()
        setDragging(false)
        const file = event.dataTransfer.files[0]
        if (file && !disabled) onSelect(file)
    }

    return (
        <div className={`form-field photo-field ${error ? "has-error" : ""}`}>
            <label htmlFor={id}>{label} <span className='optional'>(opcional)</span></label>
            <input ref={fileRef} id={id} type="file" accept={PHOTO_TYPES.join(",")}
                onChange={choose} hidden aria-describedby={`${id}-error`} />
            <div
                className={`photo-box ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={drop}
            >
                {photo.status === "none" ? (
                    <button type="button" className='photo-drop' onClick={() => fileRef.current.click()} disabled={disabled}>
                        <FiImage aria-hidden="true" />
                        <strong>Clique para escolher uma foto</strong>
                        <span>ou arraste o arquivo aqui</span>
                        <span className='photo-drop-hint'>{PHOTO_HINT}</span>
                    </button>
                ) : (
                    <>
                        <MolduraFoto photo={photo} alt={alt} className='photo-preview' />
                        {pending && <span className='photo-pending'>Será salva ao confirmar</span>}
                        {photo.status === "ready" && (
                            <div className='photo-overlay-actions'>
                                <Botao size="sm" icon={FiUpload} onClick={() => fileRef.current.click()} disabled={disabled}>
                                    Trocar
                                </Botao>
                                <Botao size="sm" icon={FiTrash2} onClick={onRemove} disabled={disabled}>
                                    Remover
                                </Botao>
                            </div>
                        )}
                    </>
                )}
            </div>
            {error && <p className='field-error' id={`${id}-error`}>{error}</p>}
        </div>
    )
}

SeletorFoto.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    photo: photoShape.isRequired,
    alt: PropTypes.string.isRequired,
    pending: PropTypes.bool.isRequired,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
}

export default SeletorFoto
