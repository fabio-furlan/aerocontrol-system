import { FiLogOut } from 'react-icons/fi'
import PropTypes from 'prop-types'
import Logo from '../Shared/Logo'
import BrasiliaClock from '../Shared/BrasiliaClock'
import "./Home.css"

<<<<<<< Updated upstream
// Tela inicial após o login. Os módulos (aeronaves, OS, painel de saúde...) serão
// adicionados aqui conforme as permissões do perfil.
const Home = ({ user, onLogout }) => (
    <div className='home-page'>
        <header className='home-topbar'>
            <div className='home-brand'>
                <Logo />
                <div>
                    <strong>FB Aero Control MRO</strong>
                    <span>Sistema de Gestão de Manutenção Aeronáutica</span>
                </div>
            </div>

            <div className='home-session'>
                <BrasiliaClock />
                <div className='home-user'>
                    <strong>{user.name}</strong>
                    <span>{user.roleLabel} · {user.base.code}</span>
                </div>
                <button type="button" className='btn-logout' onClick={onLogout}>
                    <FiLogOut /> Sair
                </button>
            </div>
        </header>

        <main className='home-main'>
            <h1>Bem-vindo(a), {user.name.split(" ")[0]}</h1>
            <p className='home-subtitle'>
                Base {user.base.code} - {user.base.name} ({user.base.city}/{user.base.state})
            </p>

            <div className='home-grid'>
                <section className='home-card'>
                    <h2>Sua sessão</h2>
                    <dl>
                        <dt>Nome</dt><dd>{user.name}</dd>
                        <dt>Matrícula</dt><dd>{user.registration}</dd>
                        <dt>E-mail</dt><dd>{user.email}</dd>
                        <dt>Perfil</dt><dd>{user.roleLabel}</dd>
                        <dt>Base</dt><dd>{user.base.code} - {user.base.name}</dd>
                    </dl>
                </section>

                <section className='home-card'>
                    <h2>Permissões do seu perfil</h2>
                    <ul className='permission-list'>
                        {user.permissions.map((permission) => (
                            <li key={permission.code}>{permission.description}</li>
                        ))}
                    </ul>
                </section>
            </div>
        </main>
=======
// Página inicial após o login
const Home = ({ user }) => (
    <div className='home'>
        <h1>Bem-vindo(a), {user.name.split(" ")[0]}</h1>
        <p className='home-subtitle'>
            Base {user.base.code} - {user.base.name} ({user.base.city}/{user.base.state})
        </p>
>>>>>>> Stashed changes
    </div>
)

Home.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string.isRequired,
        base: PropTypes.shape({
            code: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            city: PropTypes.string.isRequired,
            state: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
    onLogout: PropTypes.func.isRequired,
}

export default Home
