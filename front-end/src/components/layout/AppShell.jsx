import { FiHome, FiLogOut, FiUsers } from 'react-icons/fi'
import { LuPlane } from 'react-icons/lu'
import { useState } from 'react'
import PropTypes from 'prop-types'
import { RelogioBrasilia, Logo } from '@/components/marca'
import { Botao } from '@/components/botoes'
import PaginaAeronaves from '@/pages/aeronaves/PaginaAeronaves'
import PaginaInicio from '@/pages/inicio/PaginaInicio'
import PaginaUsuarios from '@/pages/usuarios/PaginaUsuarios'
import "./AppShell.css"

// Layout da área logada: barra do topo (marca, relógio, usuário, Sair), menu lateral e a tela atual.

// Itens do menu; os que exigem permissão só aparecem para quem a possui
const NAV_ITEMS = [
    { id: "inicio", label: "Início", icon: FiHome },
    { id: "aeronaves", label: "Aeronaves", icon: LuPlane, permission: "AERONAVE_VISUALIZAR" },
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
                    <RelogioBrasilia />
                    <div className='shell-user'>
                        <strong>{user.name}</strong>
                        <span>{user.roleLabel} · {user.base.code}</span>
                    </div>
                    <Botao variant="ghost-light" size="sm" icon={FiLogOut} onClick={onLogout}>
                        Sair
                    </Botao>
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
                    {page === "inicio" && <PaginaInicio user={user} />}
                    {page === "aeronaves" && (
                        <PaginaAeronaves
                            token={token}
                            canRegister={permissions.includes("AERONAVE_CADASTRAR")}
                            onSessionExpired={onSessionExpired}
                        />
                    )}
                    {page === "usuarios" && (
                        <PaginaUsuarios
                            token={token}
                            currentUser={user}
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
