import { FiPlus, FiSearch, FiEdit2, FiEye } from 'react-icons/fi'
import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { changeUserStatus, fetchBases, fetchRoles, fetchUserPhoto, fetchUsers } from '../../services/api'
import Avatar from '../Shared/Avatar'
import UserForm from './UserForm'
import UserDetailsModal from './UserDetailsModal'
import ProfileSummary from './ProfileSummary'
import "./Users.css"

// Perfil de administrador: único que vê o resumo da sessão e das permissões
const ADMIN_ROLE = "ENGENHEIRO"

const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
})

const UsersPage = ({ token, currentUser, onSessionExpired }) => {
    const currentUserId = currentUser.id
    const [users, setUsers] = useState([])
    const [status, setStatus] = useState("loading")
    const [loadError, setLoadError] = useState("")
    const [filters, setFilters] = useState({ search: "", role: "", active: "" })
    const [search, setSearch] = useState("")
    const [editing, setEditing] = useState(null)       // null = lista; { user } = formulário
    const [reference, setReference] = useState(null)   // perfis, permissões e bases
    const [confirmingId, setConfirmingId] = useState(null)
    const [rowError, setRowError] = useState(null)
    const [flash, setFlash] = useState("")
    const [viewing, setViewing] = useState(null)       // usuário aberto no modal
    const [photoWarning, setPhotoWarning] = useState("")

    const handleError = useCallback((error, setMessage) => {
        if (error.status === 401) onSessionExpired()
        else setMessage(error.message)
    }, [onSessionExpired])

    // Muda a cada carga da lista, para os avatares buscarem a foto de novo (ela pode ter sido trocada)
    const [loadCount, setLoadCount] = useState(0)

    const loadUsers = useCallback(() => {
        setStatus("loading")
        fetchUsers(token, filters)
            .then((data) => {
                setUsers(data)
                setLoadCount((n) => n + 1)
                setStatus("ready")
            })
            .catch((error) => {
                setStatus("error")
                handleError(error, setLoadError)
            })
    }, [token, filters, handleError])

    useEffect(loadUsers, [loadUsers])

    // Perfis/permissões e bases: carregados uma vez, usados no formulário
    useEffect(() => {
        Promise.all([fetchRoles(token), fetchBases()])
            .then(([roles, bases]) => setReference({ ...roles, bases }))
            .catch((error) => handleError(error, setLoadError))
    }, [token, handleError])

    // Busca por texto com pequena espera, para não consultar a cada tecla
    useEffect(() => {
        const timer = setTimeout(() => setFilters((f) => ({ ...f, search })), 300)
        return () => clearTimeout(timer)
    }, [search])

    const toggleStatus = async (user) => {
        setRowError(null)
        try {
            const updated = await changeUserStatus(token, user.id, !user.active)
            setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)))
            setFlash(`${updated.name} foi ${updated.active ? "reativado(a)" : "desativado(a)"}.`)
        } catch (error) {
            handleError(error, (message) => setRowError({ id: user.id, message }))
        } finally {
            setConfirmingId(null)
        }
    }

    // Os dados podem ter sido salvos mesmo que o envio da foto tenha falhado
    const handleSaved = (saved, created, photoError) => {
        setEditing(null)
        setFlash(created ? `Usuário ${saved.name} cadastrado com sucesso.` : `Dados de ${saved.name} atualizados.`)
        setPhotoWarning(photoError ? `A foto não foi salva: ${photoError} Tente novamente em Editar.` : "")
        loadUsers()
    }

    const clearMessages = () => {
        setFlash("")
        setPhotoWarning("")
    }

    if (editing) {
        return (
            <UserForm
                token={token}
                user={editing.user}
                reference={reference}
                currentUserId={currentUserId}
                onSaved={handleSaved}
                onCancel={() => setEditing(null)}
                onSessionExpired={onSessionExpired}
            />
        )
    }

    return (
        <div className='users-page'>
            <div className='page-header'>
                <div>
                    <h1>Usuários</h1>
                    <p>Cadastro de usuários, perfis e permissões de acesso.</p>
                </div>
                <button
                    type="button"
                    className='btn btn-primary'
                    onClick={() => { clearMessages(); setEditing({ user: null }) }}
                    disabled={!reference}
                >
                    <FiPlus /> Novo usuário
                </button>
            </div>

            {currentUser.role === ADMIN_ROLE && <ProfileSummary user={currentUser} />}

            {flash && <div className='alert alert-success' role="status">{flash}</div>}
            {photoWarning && <div className='alert alert-error' role="alert">{photoWarning}</div>}

            <div className='filters'>
                <label className='filter-search'>
                    <span className='sr-only'>Buscar</span>
                    <FiSearch aria-hidden="true" />
                    <input
                        type="search"
                        placeholder="Buscar por nome, matrícula ou e-mail"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </label>
                <label>
                    <span className='sr-only'>Perfil</span>
                    <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                        <option value="">Todos os perfis</option>
                        {reference?.roles.map((role) => (
                            <option key={role.code} value={role.code}>{role.label}</option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className='sr-only'>Status</span>
                    <select value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })}>
                        <option value="">Todos os status</option>
                        <option value="true">Ativos</option>
                        <option value="false">Inativos</option>
                    </select>
                </label>
            </div>

            <div className='table-card'>
                {status === "error" ? (
                    <div className='table-message'>
                        {loadError}{" "}
                        <button type="button" className='link-button' onClick={loadUsers}>Tentar novamente</button>
                    </div>
                ) : (
                    <div className='table-scroll'>
                        <table className='users-table'>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Matrícula</th>
                                    <th>Perfil</th>
                                    <th>Bases</th>
                                    <th>Status</th>
                                    <th>Último acesso</th>
                                    <th><span className='sr-only'>Ações</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {status === "loading" && users.length === 0 && (
                                    <tr><td colSpan="7" className='table-message'>Carregando usuários...</td></tr>
                                )}
                                {status === "ready" && users.length === 0 && (
                                    <tr><td colSpan="7" className='table-message'>Nenhum usuário encontrado com esses filtros.</td></tr>
                                )}
                                {users.map((user) => {
                                    const isSelf = user.id === currentUserId
                                    return (
                                        <tr key={user.id} className={user.active ? "" : "inactive"}>
                                            <td>
                                                <div className='user-cell'>
                                                    <Avatar
                                                        key={`${user.id}-${loadCount}`}
                                                        name={user.name}
                                                        hasPhoto={user.hasPhoto}
                                                        load={() => fetchUserPhoto(token, user.id)}
                                                        onSessionExpired={onSessionExpired}
                                                    />
                                                    <div>
                                                        <strong>{user.name}</strong>
                                                        <span className='cell-sub'>{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='mono'>{user.registration}</td>
                                            <td>{user.roleLabel}</td>
                                            <td className='mono'>{user.baseCodes.join(", ")}</td>
                                            <td>
                                                <span className={`badge ${user.active ? "badge-active" : "badge-inactive"}`}>
                                                    {user.active ? "Ativo" : "Inativo"}
                                                </span>
                                            </td>
                                            <td className='nowrap'>
                                                {user.lastLoginAt ? dateTime.format(new Date(user.lastLoginAt)) : "Nunca acessou"}
                                            </td>
                                            <td className='actions'>
                                                {confirmingId === user.id ? (
                                                    <span className='confirm'>
                                                        {user.active ? "Desativar?" : "Reativar?"}
                                                        <button type="button" className='btn btn-small btn-danger' onClick={() => toggleStatus(user)}>Sim</button>
                                                        <button type="button" className='btn btn-small' onClick={() => setConfirmingId(null)}>Não</button>
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className='btn btn-small'
                                                            onClick={() => setViewing(user)}
                                                            aria-label={`Visualizar ${user.name}`}
                                                        >
                                                            <FiEye /> Visualizar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className='btn btn-small'
                                                            onClick={() => { clearMessages(); setEditing({ user }) }}
                                                            disabled={!reference}
                                                        >
                                                            <FiEdit2 /> Editar
                                                        </button>
                                                        {isSelf ? (
                                                            <span className='self-tag'>Você</span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className='btn btn-small'
                                                                onClick={() => { setRowError(null); setConfirmingId(user.id) }}
                                                            >
                                                                {user.active ? "Desativar" : "Reativar"}
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {rowError?.id === user.id && <span className='row-error'>{rowError.message}</span>}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewing && (
                <UserDetailsModal
                    token={token}
                    user={viewing}
                    bases={reference?.bases}
                    onClose={() => setViewing(null)}
                    onEdit={() => { clearMessages(); setEditing({ user: viewing }); setViewing(null) }}
                    editDisabled={!reference}
                    onSessionExpired={onSessionExpired}
                />
            )}

            {status === "ready" && (
                <p className='table-count'>{users.length} {users.length === 1 ? "usuário" : "usuários"}</p>
            )}
        </div>
    )
}

UsersPage.propTypes = {
    token: PropTypes.string.isRequired,
    currentUser: PropTypes.shape({
        id: PropTypes.number.isRequired,
        role: PropTypes.string.isRequired,
    }).isRequired,
    onSessionExpired: PropTypes.func.isRequired,
}

export default UsersPage
