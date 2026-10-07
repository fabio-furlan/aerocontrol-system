import PropTypes from 'prop-types'
import "./botoes.css"

// Ação com aparência de link (ex.: "Tentar novamente", "Voltar para a lista").
// Para navegar para outro endereço, use <a>; este componente é para ações na própria tela.
const BotaoLink = ({ icon: Icon, underline = "always", className = "", children, ...rest }) => (
    <button
        type="button"
        className={`link-button link-button--underline-${underline} ${className}`.trim()}
        {...rest}
    >
        {Icon && <Icon aria-hidden="true" />}
        {children}
    </button>
)

BotaoLink.propTypes = {
    icon: PropTypes.elementType,
    underline: PropTypes.oneOf(["always", "hover"]),
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
}

export default BotaoLink
