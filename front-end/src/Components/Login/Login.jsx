import { FiEye, FiEyeOff, FiHelpCircle, FiChevronDown } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { version } from '../../../package.json'
import Logo from '../Shared/Logo'
import BrasiliaClock from '../Shared/BrasiliaClock'
import { fetchBases, login } from '../../services/api'
import { clearRememberedUser, loadRememberedUser, saveRememberedUser, saveSession } from '../../services/session'
import "./Login.css"

const ENVIRONMENT = import.meta.env.PROD ? "Produção" : "Desenvolvimento"

// Campos da API -> campos do formulário
const FIELD_MAP = { baseCode: "base", login: "username", password: "password" }

const Login = ({ onLogin }) => {

    const [remembered] = useState(loadRememberedUser)
    const [bases, setBases] = useState([])
    const [basesStatus, setBasesStatus] = useState("loading")
    const [base, setBase] = useState(remembered?.baseCode ?? "")
    const [username, setUsername] = useState(remembered?.login ?? "")
    const [password, setPassword] = useState("")
    const [rememberUser, setRememberUser] = useState(!!remembered)
    const [showPassword, setShowPassword] = useState(false)
    const [capsLock, setCapsLock] = useState(false)
    const [errors, setErrors] = useState({})
    const [formError, setFormError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const loadBases = () => {
        setBasesStatus("loading")
        fetchBases()
            .then((data) => {
                setBases(data)
                setBasesStatus("ready")
                // Base lembrada que foi desativada deixa de ser válida
                setBase((current) => (data.some((b) => b.code === current) ? current : ""))
            })
            .catch(() => setBasesStatus("error"))
    }

    useEffect(loadBases, [])

    const validate = () => {
        const newErrors = {}
        if (!base) newErrors.base = "Selecione a base de operação."
        if (!username.trim()) newErrors.username = "Informe sua matrícula ou e-mail."
        if (!password) newErrors.password = "Informe sua senha."
        return newErrors
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (submitting) return

        const newErrors = validate()
        setErrors(newErrors)
        setFormError("")
        if (Object.keys(newErrors).length > 0) return

        setSubmitting(true)
        try {
            const session = await login({ baseCode: base, login: username.trim(), password })

            if (rememberUser) saveRememberedUser(base, username.trim())
            else clearRememberedUser()

            saveSession(session)
            onLogin(session)
        } catch (error) {
            if (error.fields) {
                const fieldErrors = {}
                Object.entries(error.fields).forEach(([field, message]) => {
                    fieldErrors[FIELD_MAP[field] ?? field] = message
                })
                setErrors(fieldErrors)
            } else {
                setFormError(error.message)
            }
            if (error.status === 401) setPassword("")
            setSubmitting(false)
        }
    }

    const clearError = (field) => {
        if (errors[field]) setErrors({ ...errors, [field]: undefined })
    }

    const checkCapsLock = (event) => {
        setCapsLock(event.getModifierState("CapsLock"))
    }

    return (
        <div className='login-page'>
            <header className='topbar'>
                <div className='topbar-brand'>
                    <Logo />
                    <div>
                        <strong>FB Aero Control MRO</strong>
                        <span>Sistema de Gestão de Manutenção Aeronáutica</span>
                    </div>
                </div>

                <div className='topbar-info'>
                    <span className={`env-badge ${import.meta.env.PROD ? "prod" : "dev"}`}>{ENVIRONMENT}</span>
                    <BrasiliaClock />
                </div>
            </header>

            <main className='login-main'>
                <section className='hero'>
                    <span className='hero-eyebrow'>Sistema MRO</span>
                    <h2>
                        <span>Gestão avançada de</span>
                        <strong>manutenção aeronáutica</strong>
                    </h2>
                    <p>Controle rigoroso de TBO, rastreabilidade de componentes e compliance imutável.</p>
                    <ul className='hero-tags'>
                        <li>TBO · TSN · CSN</li>
                        <li>P/N e S/N</li>
                        <li>AD / SB</li>
                    </ul>
                </section>

                <form className='login-panel' onSubmit={handleSubmit} noValidate>
                    <div className='panel-header'>
                        <h1>Acesso ao Sistema</h1>
                        <p>Informe a base e suas credenciais corporativas.</p>
                    </div>

                    <div className='panel-body'>
                        {formError && (
                            <div className='form-alert' role="alert">{formError}</div>
                        )}

                        <div className={`field ${errors.base ? "has-error" : ""}`}>
                            <label htmlFor="base">Base / Unidade</label>
                            <div className='control'>
                                <select
                                    id="base"
                                    value={base}
                                    onChange={(e) => { setBase(e.target.value); clearError("base") }}
                                    className={base ? "" : "is-placeholder"}
                                    disabled={basesStatus !== "ready"}
                                    aria-invalid={!!errors.base}
                                    aria-describedby="base-error"
                                >
                                    <option value="">
                                        {basesStatus === "loading" ? "Carregando bases..." : "Selecione a base"}
                                    </option>
                                    {bases.map(({ code, name }) => (
                                        <option key={code} value={code}>{code} - {name}</option>
                                    ))}
                                </select>
                                <FiChevronDown className='control-chevron' />
                            </div>
                            {errors.base && <p id="base-error" className='field-error'>{errors.base}</p>}
                            {basesStatus === "error" && (
                                <p className='field-error'>
                                    Não foi possível carregar as bases.{" "}
                                    <button type="button" className='link-button' onClick={loadBases}>Tentar novamente</button>
                                </p>
                            )}
                        </div>

                        <div className={`field ${errors.username ? "has-error" : ""}`}>
                            <label htmlFor="username">Usuário</label>
                            <div className='control'>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Matrícula ou e-mail"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); clearError("username") }}
                                    aria-invalid={!!errors.username}
                                    aria-describedby="username-error"
                                />
                            </div>
                            {errors.username && <p id="username-error" className='field-error'>{errors.username}</p>}
                        </div>

                        <div className={`field ${errors.password ? "has-error" : ""}`}>
                            <label htmlFor="password">Senha</label>
                            <div className='control'>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError("password") }}
                                    onKeyUp={checkCapsLock}
                                    onBlur={() => setCapsLock(false)}
                                    aria-invalid={!!errors.password}
                                    aria-describedby="password-error"
                                />
                                <button
                                    type="button"
                                    className='toggle-password'
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {errors.password && <p id="password-error" className='field-error'>{errors.password}</p>}
                            {capsLock && (
                                <p className='caps-warning' role="status">Caps Lock está ativado.</p>
                            )}
                        </div>

                        <div className='form-options'>
                            <label className='remember'>
                                <input
                                    type="checkbox"
                                    checked={rememberUser}
                                    onChange={(e) => setRememberUser(e.target.checked)}
                                />
                                Lembrar usuário
                            </label>
                            <a href="#" className='link'>Esqueci minha senha</a>
                        </div>

                        <button type="submit" className='btn-primary' disabled={submitting}>
                            {submitting ? "Entrando..." : "Entrar"}
                        </button>
                    </div>

                    <div className='panel-notice'>
                        Área restrita - Suas ações neste sistema são monitoradas e registradas.
                    </div>
                </form>
            </main>

            <footer className='statusbar'>
                <span>FB Aero Control MRO © 2026 · Versão {version}</span>
                <a href="#" className='statusbar-link'><FiHelpCircle /> Suporte técnico</a>
            </footer>
        </div>
    )
}

Login.propTypes = {
    onLogin: PropTypes.func.isRequired,
}

export default Login
