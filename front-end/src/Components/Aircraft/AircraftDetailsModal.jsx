import { FiEdit2 } from 'react-icons/fi'
import PropTypes from 'prop-types'
import { LuPlane } from 'react-icons/lu'
import { fetchAircraftPhoto } from '../../services/api'
import Modal from '../Shared/Modal'
import PhotoFrame from '../Shared/PhotoFrame'
import { usePhoto } from '../Shared/photo'

const hours = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat("pt-BR")
const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
})

// Visualização da foto e dos dados da aeronave. Quem pode cadastrar vê o botão Editar,
// que abre o formulário (onde também se envia, troca ou remove a foto).
const AircraftDetailsModal = ({ token, aircraft, canRegister, onClose, onEdit, editDisabled = false, onSessionExpired }) => {
    const { photo } = usePhoto(() => fetchAircraftPhoto(token, aircraft.id), aircraft.hasPhoto, onSessionExpired)

    return (
        <Modal
            title={aircraft.registration}
            subtitle={`${aircraft.manufacturer} ${aircraft.model}`}
            onClose={onClose}
            footer={canRegister && (
                <button type="button" className='btn btn-primary' onClick={onEdit} disabled={editDisabled}>
                    <FiEdit2 /> Editar
                </button>
            )}
        >
            <PhotoFrame photo={photo} alt={`Aeronave ${aircraft.registration}, ${aircraft.model}`} emptyIcon={LuPlane} />

            <dl className='details-list'>
                <dt>Matrícula</dt><dd className='mono'>{aircraft.registration}</dd>
                <dt>Status</dt>
                <dd><span className={`badge status-${aircraft.status.toLowerCase()}`}>{aircraft.statusLabel}</span></dd>
                <dt>Fabricante</dt><dd>{aircraft.manufacturer}</dd>
                <dt>Modelo</dt><dd>{aircraft.model}</dd>
                <dt>Nº de série (MSN)</dt><dd className='mono'>{aircraft.serialNumber}</dd>
                <dt>Base</dt><dd>{aircraft.baseCode} - {aircraft.baseName}</dd>
                <dt>Horas totais (TSN)</dt><dd className='mono'>{hours.format(aircraft.totalFlightHours)} h</dd>
                <dt>Ciclos totais (CSN)</dt><dd className='mono'>{integer.format(aircraft.totalCycles)}</dd>
                <dt>Cadastrada em</dt><dd>{dateTime.format(new Date(aircraft.createdAt))}</dd>
                <dt>Última atualização</dt><dd>{dateTime.format(new Date(aircraft.updatedAt))}</dd>
            </dl>
        </Modal>
    )
}

AircraftDetailsModal.propTypes = {
    token: PropTypes.string.isRequired,
    aircraft: PropTypes.shape({
        id: PropTypes.number.isRequired,
        registration: PropTypes.string.isRequired,
        manufacturer: PropTypes.string.isRequired,
        model: PropTypes.string.isRequired,
        serialNumber: PropTypes.string.isRequired,
        baseCode: PropTypes.string.isRequired,
        baseName: PropTypes.string.isRequired,
        totalFlightHours: PropTypes.number.isRequired,
        totalCycles: PropTypes.number.isRequired,
        status: PropTypes.string.isRequired,
        statusLabel: PropTypes.string.isRequired,
        hasPhoto: PropTypes.bool.isRequired,
        createdAt: PropTypes.string.isRequired,
        updatedAt: PropTypes.string.isRequired,
    }).isRequired,
    canRegister: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    editDisabled: PropTypes.bool,
    onSessionExpired: PropTypes.func.isRequired,
}

export default AircraftDetailsModal
