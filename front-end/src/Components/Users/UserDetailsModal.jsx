import { FiEdit2, FiUser } from 'react-icons/fi'
import PropTypes from 'prop-types'
import { fetchUserPhoto } from '../../services/api'
import Modal from '../Shared/Modal'
import PhotoFrame from '../Shared/PhotoFrame'
import { usePhoto } from '../Shared/photo'

const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
})

// Visualização da foto e dos dados do colaborador, com atalho para a edição
const UserDetailsModal = ({ token, user, bases, onClose, onEdit, editDisabled = false, onSessionExpired }) => {
    const { photo } = usePhoto(() => fetchUserPhoto(token, user.id), user.hasPhoto, onSessionExpired)

    // "SBGR - Guarulhos" quando a lista de bases já foi carregada; senão, só o código
    const baseName = (code) => {
        const base = bases?.find((b) => b.code === code)
        return base ? `${code} - ${base.name}` : code
    }

    return (
        <Modal
            title={user.name}
            subtitle={`${user.roleLabel} · ${user.registration}`}
            onClose={onClose}
            footer={(
                <button type="button" className='btn btn-primary' onClick={onEdit} disabled={editDisabled}>
                    <FiEdit2 /> Editar
                </button>
            )}
        >
            <div className='modal-profile'>
                <PhotoFrame photo={photo} alt={`Foto de ${user.name}`} emptyIcon={FiUser} />

                <dl className='details-list'>
                    <dt>Nome</dt><dd>{user.name}</dd>
                    <dt>E-mail</dt><dd>{user.email}</dd>
                    <dt>Matrícula</dt><dd className='mono'>{user.registration}</dd>
                    <dt>Perfil</dt><dd>{user.roleLabel}</dd>
                    <dt>Licença ANAC</dt><dd className='mono'>{user.licenseNumber || "Não informada"}</dd>
                    <dt>Bases</dt>
                    <dd>{user.baseCodes.map((code) => <span key={code} className='base-line'>{baseName(code)}</span>)}</dd>
                    <dt>Status</dt>
                    <dd>
                        <span className={`badge ${user.active ? "badge-active" : "badge-inactive"}`}>
                            {user.active ? "Ativo" : "Inativo"}
                        </span>
                    </dd>
                    <dt>Último acesso</dt>
                    <dd>{user.lastLoginAt ? dateTime.format(new Date(user.lastLoginAt)) : "Nunca acessou"}</dd>
                    <dt>Cadastrado em</dt><dd>{dateTime.format(new Date(user.createdAt))}</dd>
                </dl>
            </div>
        </Modal>
    )
}

UserDetailsModal.propTypes = {
    token: PropTypes.string.isRequired,
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        registration: PropTypes.string.isRequired,
        roleLabel: PropTypes.string.isRequired,
        licenseNumber: PropTypes.string,
        baseCodes: PropTypes.arrayOf(PropTypes.string).isRequired,
        active: PropTypes.bool.isRequired,
        lastLoginAt: PropTypes.string,
        createdAt: PropTypes.string.isRequired,
        hasPhoto: PropTypes.bool.isRequired,
    }).isRequired,
    bases: PropTypes.arrayOf(PropTypes.shape({
        code: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    onClose: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    editDisabled: PropTypes.bool,
    onSessionExpired: PropTypes.func.isRequired,
}

export default UserDetailsModal
