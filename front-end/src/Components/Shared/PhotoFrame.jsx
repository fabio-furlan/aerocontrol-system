import { FiImage } from 'react-icons/fi'
import PropTypes from 'prop-types'
import { photoShape } from './photo'
import "./Photo.css"

// Moldura da foto, com os estados de carregamento, sem foto e erro
const PhotoFrame = ({ photo, alt, emptyIcon: EmptyIcon = FiImage, className = "" }) => (
    <figure className={`photo-frame ${className}`}>
        {photo.status === "ready" && <img src={photo.url} alt={alt} />}
        {photo.status === "loading" && <span className='photo-placeholder'>Carregando foto...</span>}
        {photo.status === "none" && (
            <span className='photo-placeholder'>
                <EmptyIcon aria-hidden="true" />
                Sem foto cadastrada
            </span>
        )}
        {photo.status === "error" && <span className='photo-placeholder'>Não foi possível carregar a foto.</span>}
    </figure>
)

PhotoFrame.propTypes = {
    photo: photoShape.isRequired,
    alt: PropTypes.string.isRequired,
    emptyIcon: PropTypes.elementType,
    className: PropTypes.string,
}

export default PhotoFrame
