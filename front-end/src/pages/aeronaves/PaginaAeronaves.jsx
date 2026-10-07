import { FiPlus, FiSearch, FiEdit2, FiEye } from 'react-icons/fi'
import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Botao, BotaoLink } from '@/components/botoes'
import { Alerta, Notificacao } from '@/components/avisos'
import { fetchAircraft, fetchAircraftStatuses, fetchBases } from '@/services/api'
import { formatHours, formatInteger } from '@/utils/formatters'
import AircraftForm from './components/AircraftForm'
import AircraftDetailsModal from './modals/AircraftDetailsModal'
import "./PaginaAeronaves.css"

// Consulta de aeronaves (todos os perfis). Cadastro e edição só para quem pode cadastrar.
const PaginaAeronaves = ({ token, canRegister, onSessionExpired }) => {
    const [aircraft, setAircraft] = useState([])
    const [status, setStatus] = useState("loading")
    const [loadError, setLoadError] = useState("")
    const [filters, setFilters] = useState({ search: "", baseCode: "", status: "" })
    const [search, setSearch] = useState("")
    const [editing, setEditing] = useState(null)       // null = lista; { aircraft } = formulário
    const [reference, setReference] = useState(null)   // bases e status
    const [viewing, setViewing] = useState(null)       // aeronave aberta no modal
    const [flash, setFlash] = useState(null)         // notificação de sucesso: { id, title, message }
    const [photoWarning, setPhotoWarning] = useState("")

    const handleError = useCallback((error, setMessage) => {
        if (error.status === 401) onSessionExpired()
        else setMessage(error.message)
    }, [onSessionExpired])

    const loadAircraft = useCallback(() => {
        setStatus("loading")
        fetchAircraft(token, filters)
            .then((data) => {
                setAircraft(data)
                setStatus("ready")
            })
            .catch((error) => {
                setStatus("error")
                handleError(error, setLoadError)
            })
    }, [token, filters, handleError])

    useEffect(loadAircraft, [loadAircraft])

    // Bases e status: carregados uma vez, usados nos filtros e no formulário
    useEffect(() => {
        Promise.all([fetchBases(), fetchAircraftStatuses(token)])
            .then(([bases, statuses]) => setReference({ bases, statuses }))
            .catch((error) => handleError(error, setLoadError))
    }, [token, handleError])

    // Busca por texto com pequena espera, para não consultar a cada tecla
    useEffect(() => {
        const timer = setTimeout(() => setFilters((f) => ({ ...f, search })), 300)
        return () => clearTimeout(timer)
    }, [search])

    // Os dados podem ter sido salvos mesmo que o envio da foto tenha falhado
    const handleSaved = (saved, created, photoError) => {
        setEditing(null)
        setFlash({
            id: Date.now(),
            title: created ? "Aeronave cadastrada" : "Alteração realizada",
            message: created
                ? `A aeronave ${saved.registration} foi adicionada à frota.`
                : `Os dados da aeronave ${saved.registration} foram salvos.`,
        })
        setPhotoWarning(photoError
            ? `A foto não foi salva: ${photoError} Tente novamente em Editar.`
            : "")
        loadAircraft()
    }

    // Estável entre renderizações, para o temporizador da notificação não reiniciar
    const closeFlash = useCallback(() => setFlash(null), [])

    const clearMessages = () => {
        setFlash(null)
        setPhotoWarning("")
    }

    if (editing && canRegister) {
        return (
            <AircraftForm
                token={token}
                aircraft={editing.aircraft}
                reference={reference}
                onSaved={handleSaved}
                onCancel={() => setEditing(null)}
                onSessionExpired={onSessionExpired}
            />
        )
    }


    return (
        <div className='aircraft-page'>
            <div className='page-header'>
                <div>
                    <h1>Aeronaves</h1>
                    <p>{canRegister ? "Cadastro e consulta da frota controlada." : "Consulta da frota controlada."}</p>
                </div>
                {canRegister && (
                    <Botao
                        variant="primary"
                        icon={FiPlus}
                        onClick={() => { clearMessages(); setEditing({ aircraft: null }) }}
                        disabled={!reference}
                    >
                        Nova aeronave
                    </Botao>
                )}
            </div>

            {flash && <Notificacao key={flash.id} title={flash.title} message={flash.message} onClose={closeFlash} />}
            {photoWarning && <Alerta variant="error">{photoWarning}</Alerta>}

            <div className='filters'>
                <label className='filter-search'>
                    <span className='sr-only'>Buscar</span>
                    <FiSearch aria-hidden="true" />
                    <input
                        type="search"
                        placeholder="Buscar por matrícula, modelo, fabricante ou nº de série"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </label>
                <label>
                    <span className='sr-only'>Base</span>
                    <select value={filters.baseCode} onChange={(e) => setFilters({ ...filters, baseCode: e.target.value })}>
                        <option value="">Todas as bases</option>
                        {reference?.bases.map((base) => (
                            <option key={base.code} value={base.code}>{base.code} - {base.name}</option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className='sr-only'>Status</span>
                    <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                        <option value="">Todos os status</option>
                        {reference?.statuses.map((s) => (
                            <option key={s.code} value={s.code}>{s.label}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className='table-card'>
                {status === "error" ? (
                    <div className='table-message'>
                        {loadError}{" "}
                        <BotaoLink onClick={loadAircraft}>Tentar novamente</BotaoLink>
                    </div>
                ) : (
                    <div className='table-scroll'>
                        <table className='data-table'>
                            <thead>
                                <tr>
                                    <th>Matrícula</th>
                                    <th>Fabricante / Modelo</th>
                                    <th>Nº de série</th>
                                    <th>Base</th>
                                    <th className='num'>Horas de voo</th>
                                    <th className='num'>Ciclos</th>
                                    <th>Status</th>
                                    <th><span className='sr-only'>Ações</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {status === "loading" && aircraft.length === 0 && (
                                    <tr><td colSpan="8" className='table-message'>Carregando aeronaves...</td></tr>
                                )}
                                {status === "ready" && aircraft.length === 0 && (
                                    <tr><td colSpan="8" className='table-message'>
                                        {Object.values(filters).some(Boolean)
                                            ? "Nenhuma aeronave encontrada com esses filtros."
                                            : "Nenhuma aeronave cadastrada ainda."}
                                    </td></tr>
                                )}
                                {aircraft.map((item) => (
                                    <tr key={item.id} className={item.status === "INATIVA" ? "inactive" : ""}>
                                        <td className='mono'><strong>{item.registration}</strong></td>
                                        <td>
                                            {item.model}
                                            <span className='cell-sub'>{item.manufacturer}</span>
                                        </td>
                                        <td className='mono'>{item.serialNumber}</td>
                                        <td className='mono'>{item.baseCode}</td>
                                        <td className='mono num'>{formatHours(item.totalFlightHours)}</td>
                                        <td className='mono num'>{formatInteger(item.totalCycles)}</td>
                                        <td>
                                            <span className={`badge status-${item.status.toLowerCase()}`}>{item.statusLabel}</span>
                                        </td>
                                        <td className='actions'>
                                            <Botao
                                                size="sm"
                                                icon={FiEye}
                                                onClick={() => setViewing(item)}
                                                aria-label={`Visualizar ${item.registration}`}
                                            >
                                                Visualizar
                                            </Botao>
                                            {canRegister && (
                                                <Botao
                                                    size="sm"
                                                    icon={FiEdit2}
                                                    onClick={() => { clearMessages(); setEditing({ aircraft: item }) }}
                                                    disabled={!reference}
                                                    aria-label={`Editar ${item.registration}`}
                                                >
                                                    Editar
                                                </Botao>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewing && (
                <AircraftDetailsModal
                    token={token}
                    aircraft={viewing}
                    canRegister={canRegister}
                    onClose={() => setViewing(null)}
                    onEdit={() => { clearMessages(); setEditing({ aircraft: viewing }); setViewing(null) }}
                    editDisabled={!reference}
                    onSessionExpired={onSessionExpired}
                />
            )}

            {status === "ready" && (
                <p className='table-count'>{aircraft.length} {aircraft.length === 1 ? "aeronave" : "aeronaves"}</p>
            )}
        </div>
    )
}

PaginaAeronaves.propTypes = {
    token: PropTypes.string.isRequired,
    canRegister: PropTypes.bool.isRequired,
    onSessionExpired: PropTypes.func.isRequired,
}

export default PaginaAeronaves
