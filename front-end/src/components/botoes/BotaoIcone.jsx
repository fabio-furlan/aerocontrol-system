import PropTypes from 'prop-types'
import "./botoes.css"

// Botão só com ícone (fechar, mostrar senha). O label é obrigatório: é o que o leitor de tela anuncia.
const BotaoIcone = ({ icon: Icon, label, size = "md", className = "", ...rest }) => (
    <button
        type="button"
        className={`icon-button icon-button--${size} ${className}`.trim()}
        aria-label={label}
        title={label}
        {...rest}
    >
        <Icon aria-hidden="true" />
    </button>
)

BotaoIcone.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    size: PropTypes.oneOf(["md", "lg"]),
    className: PropTypes.string,
}

export default BotaoIcone
