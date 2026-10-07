import PropTypes from 'prop-types'
import "./PaginaInicio.css"

// Tela inicial após o login
const PaginaInicio = ({ user }) => (
    <div className='home-page'>
        <h1>Bem-vindo(a), {user.name.split(" ")[0]}</h1>
        <p className='home-subtitle'>
            Base {user.base.code} - {user.base.name} ({user.base.city}/{user.base.state})
        </p>
    </div>
)

PaginaInicio.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string.isRequired,
        base: PropTypes.shape({
            code: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            city: PropTypes.string.isRequired,
            state: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
}

export default PaginaInicio
