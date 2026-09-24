import { FiHome, FiLogOut, FiUsers } from 'react-icons/fi'
import { useState } from 'react'
import PropTypes from 'prop-types'
import Logo from '../Shared/Logo'
import BrasiliaClock from '../Shared/BrasiliaClock'
import Home from '../Home/Home'
import UsersPage from '../Users/UsersPage'
import "./AppShell.css"

// Itens do menu; os que exigem permissão só aparecem para quem a possui
const NAV_ITEMS = [
    { id: "inicio", label: "Início", icon: FiHome },
    { id: "usuarios", label: "Usuários", icon: FiUsers, permission: "USUARIO_GERENCIAR" },
]

const AppShell = ({ session, onLogout, onSessionExpired }) => {
    const [page, setPage] = useState("inicio")
    const { user, token } = session

    const permissions = user.permissions.map((p) => p.code)
    const items = NAV_ITEMS.filter((item) => !item.permission || permissions.includes(item.permission))

    return (
        <div className='shell'>
            <header className='shell-topbar'>
                <div className='shell-brand'>
                    <Logo />
                    <div>
                        <strong>FB Aero Control MRO</strong>
                        <span>Sistema de Gestão de Manutenção Aeronáutica</span>
                    </div>
                </div>

                <div className='shell-session'>
                    <BrasiliaClock />
                    <div className='shell-user'>
                        <strong>{user.name}</strong>
                        <span>{user.roleLabel} · {user.base.code}</span>
                    </div>
                    <button type="button" className='btn-logout' onClick={onLogout}>
                        <FiLogOut /> Sair
                    </button>
                </div>
            </header>

            <div className='shell-body'>
                <nav className='shell-nav' aria-label="Menu principal">
                    {items.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            className={`nav-item ${page === id ? "active" : ""}`}
                            aria-current={page === id ? "page" : undefined}
                            onClick={() => setPage(id)}
                        >
                            <Icon /> {label}
                        </button>
                    ))}
                </nav>

                <main className='shell-content'>
                    {page === "inicio" && <Home user={user} />}
                    {page === "usuarios" && (
                        <UsersPage
                            token={token}
                            currentUserId={user.id}
                            onSessionExpired={onSessionExpired}
                        />
                    )}
                </main>
            </div>
        </div>
    )
}

AppShell.propTypes = {
    session: PropTypes.shape({
        token: PropTypes.string.isRequired,
        user: PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            roleLabel: PropTypes.string.isRequired,
            base: PropTypes.shape({ code: PropTypes.string.isRequired }).isRequired,
            permissions: PropTypes.arrayOf(PropTypes.shape({ code: PropTypes.string.isRequired })).isRequired,
        }).isRequired,
    }).isRequired,
    onLogout: PropTypes.func.isRequired,
    onSessionExpired: PropTypes.func.isRequired,
}

export default AppShell
