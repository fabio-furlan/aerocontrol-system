import PropTypes from 'prop-types'

// Aviso fixo dentro da página. Erros são anunciados imediatamente pelo leitor de tela (role="alert").
// Para confirmações passageiras (ex.: "Alteração realizada"), use o Notificacao.
const Alerta = ({ variant = "error", children }) => (
    <div className={`alert alert-${variant}`} role={variant === "error" ? "alert" : "status"}>
        {children}
    </div>
)

Alerta.propTypes = {
    variant: PropTypes.oneOf(["success", "error", "warning"]),
    children: PropTypes.node.isRequired,
}

export default Alerta
