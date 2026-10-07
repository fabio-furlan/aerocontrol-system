import { FiAlertTriangle, FiArrowRight, FiCheck, FiEdit3, FiShield } from 'react-icons/fi'
import PropTypes from 'prop-types'
import { Botao } from '@/components/botoes'
import { Modal } from '@/components/modal'
import "./ConfirmChangesModal.css"

// Confirmação antes de salvar a edição da aeronave: mostra o "antes → depois" de cada campo alterado
const ConfirmChangesModal = ({ aircraft, changes, warnFlightData, saving, onConfirm, onClose }) => {
    const count = changes.length
    const plural = count === 1 ? "informação" : "informações"

    return (
        <Modal
            className='modal-confirm'
            title="Confirmar alterações"
            subtitle={`${aircraft.registration} · ${aircraft.manufacturer} ${aircraft.model}`}
            // Enquanto salva, o modal não pode ser fechado
            onClose={saving ? () => {} : onClose}
            footer={(
                <>
                    <Botao onClick={onClose} disabled={saving}>
                        Voltar
                    </Botao>
                    <Botao variant="primary" icon={FiCheck} onClick={onConfirm} loading={saving} loadingText="Salvando..." autoFocus>
                        Confirmar
                    </Botao>
                </>
            )}
        >
            <div className='confirm-intro'>
                <span className='confirm-icon' aria-hidden="true"><FiEdit3 /></span>
                <div>
                    <p className='confirm-lead'>
                        Você está alterando {count} {plural} da aeronave <strong>{aircraft.registration}</strong>.
                    </p>
                    <p className='confirm-sub'>Confira os novos valores antes de salvar.</p>
                </div>
            </div>

            <div className='change-table' role="table" aria-label="Alterações">
                <div className='change-row change-head' role="row">
                    <span role="columnheader">Campo</span>
                    <span role="columnheader">Antes</span>
                    <span aria-hidden="true" />
                    <span role="columnheader">Depois</span>
                </div>
                {changes.map((change) => (
                    <div className='change-row' role="row" key={change.field}>
                        <span className='change-label' role="cell">{change.label}</span>
                        <span className='change-before' role="cell">{change.before}</span>
                        <FiArrowRight className='change-arrow' aria-hidden="true" />
                        <span className='change-after' role="cell">{change.after}</span>
                    </div>
                ))}
            </div>

            {warnFlightData && (
                <div className='confirm-warning' role="note">
                    <FiAlertTriangle aria-hidden="true" />
                    <span>
                        Horas e ciclos são a base do controle de TBO dos componentes.
                        Confirme se os valores conferem com os registros de voo.
                    </span>
                </div>
            )}

            <p className='confirm-audit'>
                <FiShield aria-hidden="true" />
                A alteração ficará registrada na auditoria com seu usuário, data e hora.
            </p>
        </Modal>
    )
}

ConfirmChangesModal.propTypes = {
    aircraft: PropTypes.shape({
        registration: PropTypes.string.isRequired,
        manufacturer: PropTypes.string.isRequired,
        model: PropTypes.string.isRequired,
    }).isRequired,
    changes: PropTypes.arrayOf(PropTypes.shape({
        field: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        before: PropTypes.node.isRequired,
        after: PropTypes.node.isRequired,
    })).isRequired,
    warnFlightData: PropTypes.bool.isRequired,
    saving: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
}

export default ConfirmChangesModal
