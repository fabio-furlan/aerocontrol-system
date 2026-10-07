import PropTypes from 'prop-types'
import "./botoes.css"

// Botão padrão do sistema. Toda ação em forma de botão usa este componente.
//   variant: primary (ação principal), secondary (padrão), danger (ação destrutiva),
//            ghost-light (sobre fundo escuro, ex.: barra do topo)
//   size:    sm (tabelas), md (padrão), lg (telas de acesso)
//   loading: desabilita e mostra loadingText no lugar do texto
const Botao = ({
    variant = "secondary",
    size = "md",
    type = "button",
    icon: Icon,
    loading = false,
    loadingText,
    fullWidth = false,
    disabled = false,
    className = "",
    children,
    ...rest
}) => {
    const classes = [
        "btn",
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth && "btn--block",
        className,
    ].filter(Boolean).join(" ")

    return (
        <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
            {Icon && !loading && <Icon aria-hidden="true" />}
            {loading && loadingText ? loadingText : children}
        </button>
    )
}

Botao.propTypes = {
    variant: PropTypes.oneOf(["primary", "secondary", "danger", "ghost-light"]),
    size: PropTypes.oneOf(["sm", "md", "lg"]),
    type: PropTypes.oneOf(["button", "submit", "reset"]),
    icon: PropTypes.elementType,
    loading: PropTypes.bool,
    loadingText: PropTypes.string,
    fullWidth: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
}

export default Botao
