import { FiEdit2 } from 'react-icons/fi'
import PropTypes from 'prop-types'
import { LuPlane } from 'react-icons/lu'
import { Botao } from '@/components/botoes'
import { Modal } from '@/components/modal'
import { MolduraFoto } from '@/components/foto'
import { usePhoto } from '@/hooks/usePhoto'
import { fetchAircraftPhoto } from '@/services/api'
import { formatDateTime, formatHours, formatInteger } from '@/utils/formatters'

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
                <Botao variant="primary" icon={FiEdit2} onClick={onEdit} disabled={editDisabled}>
                    Editar
                </Botao>
            )}
        >
            <MolduraFoto photo={photo} alt={`Aeronave ${aircraft.registration}, ${aircraft.model}`} emptyIcon={LuPlane} />

            <dl className='details-list'>
                <dt>Matrícula</dt><dd className='mono'>{aircraft.registration}</dd>
                <dt>Status</dt>
                <dd><span className={`badge status-${aircraft.status.toLowerCase()}`}>{aircraft.statusLabel}</span></dd>
                <dt>Fabricante</dt><dd>{aircraft.manufacturer}</dd>
                <dt>Modelo</dt><dd>{aircraft.model}</dd>
                <dt>Nº de série (MSN)</dt><dd className='mono'>{aircraft.serialNumber}</dd>
                <dt>Base</dt><dd>{aircraft.baseCode} - {aircraft.baseName}</dd>
                <dt>Horas totais (TSN)</dt><dd className='mono'>{formatHours(aircraft.totalFlightHours)} h</dd>
                <dt>Ciclos totais (CSN)</dt><dd className='mono'>{formatInteger(aircraft.totalCycles)}</dd>
                <dt>Cadastrada em</dt><dd>{formatDateTime(aircraft.createdAt)}</dd>
                <dt>Última atualização</dt><dd>{formatDateTime(aircraft.updatedAt)}</dd>
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
