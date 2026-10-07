import { FiArrowLeft, FiCheck, FiMinus, FiEye, FiEyeOff } from 'react-icons/fi'
import { useState } from 'react'
import PropTypes from 'prop-types'
import { Botao, BotaoIcone, BotaoLink } from '@/components/botoes'
import { Alerta } from '@/components/avisos'
import { SeletorFoto } from '@/components/foto'
import { usePhotoField } from '@/hooks/usePhotoField'
import { createUser, deleteUserPhoto, fetchUserPhoto, updateUser, uploadUserPhoto } from '@/services/api'
import "./UserForm.css"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_POLICY = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/

const emptyForm = {
    name: "",
    email: "",
    registration: "",
    licenseNumber: "",
    role: "",
    baseCodes: [],
    password: "",
    passwordConfirm: "",
}

// Cadastro e edição de usuário: dados, foto, perfil com permissões, bases e senha
const UserForm = ({ token, user, reference, currentUserId, onSaved, onCancel, onSessionExpired }) => {
    const isEdit = user !== null
    const isSelf = isEdit && user.id === currentUserId

    const [form, setForm] = useState(() => (isEdit ? {
        ...emptyForm,
        name: user.name,
        email: user.email,
        registration: user.registration,
        licenseNumber: user.licenseNumber ?? "",
        role: user.role,
        baseCodes: user.baseCodes,
    } : emptyForm))
    const [errors, setErrors] = useState({})
    const [formError, setFormError] = useState("")
    const [saving, setSaving] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Foto: a escolhida só é enviada (ou a atual removida) ao salvar o formulário
    const photoField = usePhotoField(
        () => fetchUserPhoto(token, user.id), isEdit && user.hasPhoto, onSessionExpired)

    const selectedRole = reference.roles.find((role) => role.code === form.role)

    const setField = (field, value) => {
        setForm((f) => ({ ...f, [field]: value }))
        if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
    }

    const toggleBase = (code) => {
        const baseCodes = form.baseCodes.includes(code)
            ? form.baseCodes.filter((c) => c !== code)
            : [...form.baseCodes, code]
        setField("baseCodes", baseCodes)
    }

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = "Informe o nome."
        if (!form.email.trim()) e.email = "Informe o e-mail."
        else if (!EMAIL_PATTERN.test(form.email.trim())) e.email = "Informe um e-mail válido."
        if (!form.registration.trim()) e.registration = "Informe a matrícula."
        if (!form.role) e.role = "Selecione o perfil de acesso."
        if (form.baseCodes.length === 0) e.baseCodes = "Selecione ao menos uma base."

        if (!isEdit && !form.password) e.password = "Informe a senha inicial."
        else if (form.password && !PASSWORD_POLICY.test(form.password)) {
            e.password = "A senha deve ter de 8 a 72 caracteres, com letras e números."
        }
        if (form.password && form.password !== form.passwordConfirm) {
            e.passwordConfirm = "As senhas não conferem."
        }
        return e
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (saving) return

        const e = validate()
        setErrors(e)
        setFormError("")
        if (Object.keys(e).length > 0) return

        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            registration: form.registration.trim(),
            licenseNumber: form.licenseNumber.trim() || null,
            role: form.role,
            baseCodes: form.baseCodes,
            password: form.password || null,
        }

        setSaving(true)
        try {
            const data = isEdit
                ? await updateUser(token, user.id, payload)
                : await createUser(token, payload)
            const { saved, photoError } = await photoField.apply(data, {
                upload: (id, file) => uploadUserPhoto(token, id, file),
                remove: (id) => deleteUserPhoto(token, id),
            })
            onSaved(saved, !isEdit, photoError)
        } catch (error) {
            if (error.status === 401) {
                onSessionExpired()
                return
            }
            if (error.fields) setErrors(error.fields)
            setFormError(error.message)
            setSaving(false)
        }
    }

    const fieldClass = (field) => `form-field ${errors[field] ? "has-error" : ""}`
    const errorText = (field) => errors[field] && <p className='field-error' id={`${field}-error`}>{errors[field]}</p>

    return (
        <form className='page-form' onSubmit={handleSubmit} noValidate>
            <div className='page-header'>
                <div>
                    <BotaoLink icon={FiArrowLeft} underline="hover" onClick={onCancel}>
                        Voltar para a lista
                    </BotaoLink>
                    <h1>{isEdit ? "Editar usuário" : "Novo usuário"}</h1>
                    {isEdit && <p>{user.name} · {user.registration}</p>}
                </div>
            </div>

            {formError && <Alerta variant="error">{formError}</Alerta>}

            <section className='form-card'>
                <h2>Dados do colaborador</h2>
                {/* Campos à esquerda e foto do colaborador numa coluna à direita */}
                <div className='form-with-photo portrait'>
                    <div className='form-grid'>
                        <div className={`${fieldClass("name")} span-2`}>
                            <label htmlFor="name">Nome completo</label>
                            <input id="name" value={form.name} maxLength={120}
                                onChange={(e) => setField("name", e.target.value)}
                                aria-invalid={!!errors.name} aria-describedby="name-error" />
                            {errorText("name")}
                        </div>
                        <div className={fieldClass("email")}>
                            <label htmlFor="email">E-mail corporativo</label>
                            <input id="email" type="email" value={form.email} maxLength={160}
                                onChange={(e) => setField("email", e.target.value)}
                                aria-invalid={!!errors.email} aria-describedby="email-error" />
                            {errorText("email")}
                        </div>
                        <div className={fieldClass("registration")}>
                            <label htmlFor="registration">Matrícula</label>
                            <input id="registration" value={form.registration} maxLength={20}
                                onChange={(e) => setField("registration", e.target.value.toUpperCase())}
                                aria-invalid={!!errors.registration} aria-describedby="registration-error" />
                            {errorText("registration")}
                        </div>
                        <div className={fieldClass("licenseNumber")}>
                            <label htmlFor="licenseNumber">Licença ANAC / CANAC <span className='optional'>(opcional)</span></label>
                            <input id="licenseNumber" value={form.licenseNumber} maxLength={30}
                                onChange={(e) => setField("licenseNumber", e.target.value)}
                                aria-invalid={!!errors.licenseNumber} aria-describedby="licenseNumber-error" />
                            {errorText("licenseNumber")}
                        </div>
                    </div>
                    <SeletorFoto
                        id="photo"
                        label="Foto do colaborador"
                        photo={photoField.photo}
                        alt={`Foto de ${form.name || "colaborador"}`}
                        pending={photoField.pending}
                        error={photoField.error}
                        disabled={saving}
                        onSelect={photoField.select}
                        onRemove={photoField.remove}
                    />
                </div>
            </section>

            <section className='form-card'>
                <h2>Perfil e permissões de acesso</h2>
                <div className='role-layout'>
                    <fieldset className={fieldClass("role")} aria-describedby="role-error">
                        <legend>Perfil</legend>
                        {reference.roles.map((role) => (
                            <label key={role.code} className={`choice-option ${form.role === role.code ? "selected" : ""}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value={role.code}
                                    checked={form.role === role.code}
                                    onChange={() => setField("role", role.code)}
                                    disabled={isSelf}
                                />
                                <span>{role.label}</span>
                            </label>
                        ))}
                        {isSelf && <p className='hint'>Você não pode alterar o seu próprio perfil.</p>}
                        {errorText("role")}
                    </fieldset>

                    <div className='permission-matrix'>
                        <h3>{selectedRole ? `Permissões de ${selectedRole.label}` : "Selecione um perfil para ver as permissões"}</h3>
                        <ul>
                            {reference.permissions.map((permission) => {
                                const granted = selectedRole?.permissions.includes(permission.code)
                                return (
                                    <li key={permission.code} className={granted ? "granted" : "denied"}>
                                        {granted ? <FiCheck aria-label="Permitido" /> : <FiMinus aria-label="Não permitido" />}
                                        {permission.description}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            </section>

            <section className='form-card'>
                <h2>Bases autorizadas</h2>
                <fieldset className={fieldClass("baseCodes")} aria-describedby="baseCodes-error">
                    <legend className='sr-only'>Bases autorizadas</legend>
                    <div className='base-options'>
                        {reference.bases.map((base) => (
                            <label key={base.code} className={`choice-option ${form.baseCodes.includes(base.code) ? "selected" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={form.baseCodes.includes(base.code)}
                                    onChange={() => toggleBase(base.code)}
                                />
                                <span><strong>{base.code}</strong> {base.name} - {base.city}/{base.state}</span>
                            </label>
                        ))}
                    </div>
                    {errorText("baseCodes")}
                </fieldset>
            </section>

            <section className='form-card'>
                <h2>{isEdit ? "Redefinir senha" : "Senha inicial"}</h2>
                {isEdit && <p className='hint'>Deixe em branco para manter a senha atual.</p>}
                <div className='form-grid'>
                    <div className={fieldClass("password")}>
                        <label htmlFor="password">{isEdit ? "Nova senha" : "Senha"}</label>
                        <div className='password-input'>
                            <input id="password" type={showPassword ? "text" : "password"} value={form.password}
                                autoComplete="new-password" maxLength={72}
                                onChange={(e) => setField("password", e.target.value)}
                                aria-invalid={!!errors.password} aria-describedby="password-error password-hint" />
                            <BotaoIcone
                                icon={showPassword ? FiEyeOff : FiEye}
                                label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                onClick={() => setShowPassword(!showPassword)}
                            />
                        </div>
                        {errors.password
                            ? errorText("password")
                            : <p className='hint' id="password-hint">Mínimo de 8 caracteres, com letras e números.</p>}
                    </div>
                    <div className={fieldClass("passwordConfirm")}>
                        <label htmlFor="passwordConfirm">Confirmar senha</label>
                        <input id="passwordConfirm" type={showPassword ? "text" : "password"} value={form.passwordConfirm}
                            autoComplete="new-password" maxLength={72}
                            onChange={(e) => setField("passwordConfirm", e.target.value)}
                            aria-invalid={!!errors.passwordConfirm} aria-describedby="passwordConfirm-error" />
                        {errorText("passwordConfirm")}
                    </div>
                </div>
            </section>

            <div className='form-actions'>
                <Botao onClick={onCancel} disabled={saving}>Cancelar</Botao>
                <Botao type="submit" variant="primary" loading={saving} loadingText="Salvando...">
                    {isEdit ? "Salvar alterações" : "Cadastrar usuário"}
                </Botao>
            </div>
        </form>
    )
}

UserForm.propTypes = {
    token: PropTypes.string.isRequired,
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        registration: PropTypes.string.isRequired,
        licenseNumber: PropTypes.string,
        role: PropTypes.string.isRequired,
        baseCodes: PropTypes.arrayOf(PropTypes.string).isRequired,
        hasPhoto: PropTypes.bool.isRequired,
    }),
    reference: PropTypes.shape({
        roles: PropTypes.arrayOf(PropTypes.shape({
            code: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            permissions: PropTypes.arrayOf(PropTypes.string).isRequired,
        })).isRequired,
        permissions: PropTypes.arrayOf(PropTypes.shape({
            code: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
        })).isRequired,
        bases: PropTypes.arrayOf(PropTypes.shape({
            code: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            city: PropTypes.string.isRequired,
            state: PropTypes.string.isRequired,
        })).isRequired,
    }).isRequired,
    currentUserId: PropTypes.number.isRequired,
    onSaved: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onSessionExpired: PropTypes.func.isRequired,
}

export default UserForm
