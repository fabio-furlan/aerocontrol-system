import PropTypes from 'prop-types'
import "./ProfileSummary.css"

// Dados da sessão e permissões do perfil do usuário logado
const ProfileSummary = ({ user }) => (
    <div className='profile-grid'>
        <section className='profile-card'>
            <h2>Sua sessão</h2>
            <dl>
                <dt>Nome</dt><dd>{user.name}</dd>
                <dt>Matrícula</dt><dd>{user.registration}</dd>
                <dt>E-mail</dt><dd>{user.email}</dd>
                <dt>Perfil</dt><dd>{user.roleLabel}</dd>
                <dt>Base</dt><dd>{user.base.code} - {user.base.name}</dd>
            </dl>
        </section>

        <section className='profile-card'>
            <h2>Permissões do seu perfil</h2>
            <ul className='permission-list'>
                {user.permissions.map((permission) => (
                    <li key={permission.code}>{permission.description}</li>
                ))}
            </ul>
        </section>
    </div>
)

ProfileSummary.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        registration: PropTypes.string.isRequired,
        roleLabel: PropTypes.string.isRequired,
        base: PropTypes.shape({
            code: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        }).isRequired,
        permissions: PropTypes.arrayOf(PropTypes.shape({
            code: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
        })).isRequired,
    }).isRequired,
}

export default ProfileSummary
