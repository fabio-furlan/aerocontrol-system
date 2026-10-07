import { FiPlus, FiSearch, FiEdit2, FiEye } from 'react-icons/fi'
import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Botao, BotaoLink } from '@/components/botoes'
import { Alerta, Notificacao } from '@/components/avisos'
import { Avatar } from '@/components/foto'
import { changeUserStatus, fetchBases, fetchRoles, fetchUserPhoto, fetchUsers } from '@/services/api'
import { formatDateTime } from '@/utils/formatters'
import ProfileSummary from './components/ProfileSummary'
import UserForm from './components/UserForm'
import UserDetailsModal from './modals/UserDetailsModal'
import "./PaginaUsuarios.css"

// Perfil de administrador: único que vê o resumo da sessão e das permissões
const ADMIN_ROLE = "ENGENHEIRO"

// Tela de usuários: lista com filtros, cadastro/edição, visualização e ativação/desativação
const PaginaUsuarios = ({ token, currentUser, onSessionExpired }) => {
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
    const [flash, setFlash] = useState(null)         // notificação de sucesso: { id, title, message }
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
            setFlash({
                id: Date.now(),
                title: updated.active ? "Usuário reativado" : "Usuário desativado",
                message: `${updated.name} foi ${updated.active ? "reativado(a)" : "desativado(a)"}.`,
            })
        } catch (error) {
            handleError(error, (message) => setRowError({ id: user.id, message }))
        } finally {
            setConfirmingId(null)
        }
    }

    // Os dados podem ter sido salvos mesmo que o envio da foto tenha falhado
    const handleSaved = (saved, created, photoError) => {
        setEditing(null)
        setFlash({
            id: Date.now(),
            title: created ? "Usuário cadastrado" : "Alteração realizada",
            message: created ? `${saved.name} foi cadastrado(a) com sucesso.` : `Os dados de ${saved.name} foram salvos.`,
        })
        setPhotoWarning(photoError ? `A foto não foi salva: ${photoError} Tente novamente em Editar.` : "")
        loadUsers()
    }

    // Estável entre renderizações, para o temporizador da notificação não reiniciar
    const closeFlash = useCallback(() => setFlash(null), [])

    const clearMessages = () => {
        setFlash(null)
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
                <Botao
                    variant="primary"
                    icon={FiPlus}
                    onClick={() => { clearMessages(); setEditing({ user: null }) }}
                    disabled={!reference}
                >
                    Novo usuário
                </Botao>
            </div>

            {currentUser.role === ADMIN_ROLE && <ProfileSummary user={currentUser} />}

            {flash && <Notificacao key={flash.id} title={flash.title} message={flash.message} onClose={closeFlash} />}
            {photoWarning && <Alerta variant="error">{photoWarning}</Alerta>}

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
                        <BotaoLink onClick={loadUsers}>Tentar novamente</BotaoLink>
                    </div>
                ) : (
                    <div className='table-scroll'>
                        <table className='data-table'>
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
                                                {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Nunca acessou"}
                                            </td>
                                            <td className='actions'>
                                                {confirmingId === user.id ? (
                                                    <span className='row-confirm'>
                                                        {user.active ? "Desativar?" : "Reativar?"}
                                                        <Botao size="sm" variant="danger" onClick={() => toggleStatus(user)}>Sim</Botao>
                                                        <Botao size="sm" onClick={() => setConfirmingId(null)}>Não</Botao>
                                                    </span>
                                                ) : (
                                                    <>
                                                        <Botao
                                                            size="sm"
                                                            icon={FiEye}
                                                            onClick={() => setViewing(user)}
                                                            aria-label={`Visualizar ${user.name}`}
                                                        >
                                                            Visualizar
                                                        </Botao>
                                                        <Botao
                                                            size="sm"
                                                            icon={FiEdit2}
                                                            onClick={() => { clearMessages(); setEditing({ user }) }}
                                                            disabled={!reference}
                                                            aria-label={`Editar ${user.name}`}
                                                        >
                                                            Editar
                                                        </Botao>
                                                        {isSelf ? (
                                                            <span className='self-tag'>Você</span>
                                                        ) : (
                                                            <Botao
                                                                size="sm"
                                                                onClick={() => { setRowError(null); setConfirmingId(user.id) }}
                                                            >
                                                                {user.active ? "Desativar" : "Reativar"}
                                                            </Botao>
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

PaginaUsuarios.propTypes = {
    token: PropTypes.string.isRequired,
    currentUser: PropTypes.shape({
        id: PropTypes.number.isRequired,
        role: PropTypes.string.isRequired,
    }).isRequired,
    onSessionExpired: PropTypes.func.isRequired,
}

export default PaginaUsuarios
