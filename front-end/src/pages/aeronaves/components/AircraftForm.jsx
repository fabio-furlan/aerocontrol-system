import { FiArrowLeft } from 'react-icons/fi'
import { useState } from 'react'
import PropTypes from 'prop-types'
import { Botao, BotaoLink } from '@/components/botoes'
import { Alerta } from '@/components/avisos'
import { SeletorFoto } from '@/components/foto'
import { usePhotoField } from '@/hooks/usePhotoField'
import {
    createAircraft, deleteAircraftPhoto, fetchAircraftPhoto, updateAircraft, uploadAircraftPhoto,
} from '@/services/api'
import ConfirmChangesModal from '../modals/ConfirmChangesModal'

// Mesmo formato aceito pela API: prefixo + marcas, com ou sem hífen (PR-FBA, N123AB)
const REGISTRATION_FORMAT = /^[A-Z0-9]{1,3}-?[A-Z0-9]{2,6}$/
const HOURS_FORMAT = /^\d{1,9}([.,]\d)?$/

const emptyForm = {
    registration: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    baseCode: "",
    status: "OPERACIONAL",
    totalFlightHours: "0",
    totalCycles: "0",
}

// Campos mostrados no resumo da confirmação, na ordem da tela
const FIELD_LABELS = {
    registration: "Matrícula",
    serialNumber: "Número de série (MSN)",
    manufacturer: "Fabricante",
    model: "Modelo",
    baseCode: "Base de manutenção",
    status: "Status",
    totalFlightHours: "Horas totais de voo (TSN)",
    totalCycles: "Ciclos totais (CSN)",
}

// Valor comparável: ignora espaços nas pontas e aceita vírgula ou ponto nas horas
const normalize = (field, value) => {
    const text = value.trim()
    return field === "totalFlightHours" ? text.replace(".", ",") : text
}

// Cadastro e edição de aeronave. Na edição, salvar só habilita com alteração e pede confirmação.
const AircraftForm = ({ token, aircraft, reference, onSaved, onCancel, onSessionExpired }) => {
    const isEdit = aircraft !== null

    // Valores originais, usados para saber se algo foi alterado na edição
    const [initialForm] = useState(() => (isEdit ? {
        registration: aircraft.registration,
        manufacturer: aircraft.manufacturer,
        model: aircraft.model,
        serialNumber: aircraft.serialNumber,
        baseCode: aircraft.baseCode,
        status: aircraft.status,
        totalFlightHours: String(aircraft.totalFlightHours).replace(".", ","),
        totalCycles: String(aircraft.totalCycles),
    } : emptyForm))
    const [form, setForm] = useState(initialForm)
    const [errors, setErrors] = useState({})
    const [formError, setFormError] = useState("")
    const [saving, setSaving] = useState(false)
    const [confirming, setConfirming] = useState(false)

    // Foto: a escolhida só é enviada (ou a atual removida) ao salvar o formulário
    const photoField = usePhotoField(
        () => fetchAircraftPhoto(token, aircraft.id), isEdit && aircraft.hasPhoto, onSessionExpired)

    const changedFields = isEdit
        ? Object.keys(FIELD_LABELS).filter((f) => normalize(f, form[f]) !== normalize(f, initialForm[f]))
        : []
    const hasChanges = !isEdit || changedFields.length > 0 || photoField.pending

    const displayValue = (field, value) => {
        if (field === "status") {
            const label = reference.statuses.find((s) => s.code === value)?.label ?? value
            return <span className={`badge status-${value.toLowerCase()}`}>{label}</span>
        }
        if (field === "baseCode") {
            const base = reference.bases.find((b) => b.code === value)
            return base ? `${base.code} - ${base.name}` : value
        }
        if (field === "totalFlightHours") return `${normalize(field, value)} h`
        return normalize(field, value)
    }

    // Linhas do resumo exibido na confirmação
    const changes = changedFields.map((field) => ({
        field,
        label: FIELD_LABELS[field],
        before: displayValue(field, initialForm[field]),
        after: displayValue(field, form[field]),
    }))
    if (photoField.pending) {
        changes.push({
            field: "photo",
            label: "Foto",
            before: isEdit && aircraft.hasPhoto ? "Foto atual" : "Sem foto",
            after: photoField.photo.status === "none" ? "Removida" : "Nova foto",
        })
    }

    const setField = (field, value) => {
        setForm((f) => ({ ...f, [field]: value }))
        if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
    }

    const validate = () => {
        const e = {}
        const registration = form.registration.trim()
        if (!registration) e.registration = "Informe a matrícula."
        else if (!REGISTRATION_FORMAT.test(registration)) e.registration = "Matrícula inválida. Use o formato do prefixo, ex.: PR-FBA."
        if (!form.manufacturer.trim()) e.manufacturer = "Informe o fabricante."
        if (!form.model.trim()) e.model = "Informe o modelo."
        if (!form.serialNumber.trim()) e.serialNumber = "Informe o número de série."
        if (!form.baseCode) e.baseCode = "Selecione a base."
        if (!form.status) e.status = "Selecione o status."
        if (!HOURS_FORMAT.test(form.totalFlightHours.trim())) {
            e.totalFlightHours = "Informe as horas com no máximo uma casa decimal (ex.: 1520,5)."
        }
        if (!/^\d{1,9}$/.test(form.totalCycles.trim())) e.totalCycles = "Informe um número inteiro de ciclos."
        return e
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        if (saving || !hasChanges) return

        const e = validate()
        setErrors(e)
        setFormError("")
        if (Object.keys(e).length > 0) return

        // Na edição, o usuário confirma as alterações antes de enviar
        if (isEdit) setConfirming(true)
        else save()
    }

    const save = async () => {
        const payload = {
            registration: form.registration.trim(),
            manufacturer: form.manufacturer.trim(),
            model: form.model.trim(),
            serialNumber: form.serialNumber.trim(),
            baseCode: form.baseCode,
            status: form.status,
            totalFlightHours: Number(form.totalFlightHours.trim().replace(",", ".")),
            totalCycles: Number(form.totalCycles.trim()),
        }

        setSaving(true)
        try {
            const data = isEdit
                ? await updateAircraft(token, aircraft.id, payload)
                : await createAircraft(token, payload)
            const { saved, photoError } = await photoField.apply(data, {
                upload: (id, file) => uploadAircraftPhoto(token, id, file),
                remove: (id) => deleteAircraftPhoto(token, id),
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
            setConfirming(false)
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
                    <h1>{isEdit ? "Editar aeronave" : "Nova aeronave"}</h1>
                    {isEdit && <p>{aircraft.registration} · {aircraft.model}</p>}
                </div>
            </div>

            {formError && <Alerta variant="error">{formError}</Alerta>}

            <section className='form-card'>
                <h2>Identificação</h2>
                {/* Campos à esquerda e foto numa coluna à direita */}
                <div className='form-with-photo'>
                    <div className='form-grid'>
                        <div className={fieldClass("registration")}>
                            <label htmlFor="registration">Matrícula</label>
                            <input id="registration" value={form.registration} maxLength={10} placeholder="PR-FBA"
                                onChange={(e) => setField("registration", e.target.value.toUpperCase())}
                                aria-invalid={!!errors.registration} aria-describedby="registration-error" />
                            {errorText("registration")}
                        </div>
                        <div className={fieldClass("serialNumber")}>
                            <label htmlFor="serialNumber">Número de série (MSN)</label>
                            <input id="serialNumber" value={form.serialNumber} maxLength={40}
                                onChange={(e) => setField("serialNumber", e.target.value)}
                                aria-invalid={!!errors.serialNumber} aria-describedby="serialNumber-error" />
                            {errorText("serialNumber")}
                        </div>
                        <div className={fieldClass("manufacturer")}>
                            <label htmlFor="manufacturer">Fabricante</label>
                            <input id="manufacturer" value={form.manufacturer} maxLength={60} placeholder="Embraer"
                                onChange={(e) => setField("manufacturer", e.target.value)}
                                aria-invalid={!!errors.manufacturer} aria-describedby="manufacturer-error" />
                            {errorText("manufacturer")}
                        </div>
                        <div className={fieldClass("model")}>
                            <label htmlFor="model">Modelo</label>
                            <input id="model" value={form.model} maxLength={60} placeholder="E195-E2"
                                onChange={(e) => setField("model", e.target.value)}
                                aria-invalid={!!errors.model} aria-describedby="model-error" />
                            {errorText("model")}
                        </div>
                    </div>

                    <SeletorFoto
                        id="photo"
                        label="Foto da aeronave"
                        photo={photoField.photo}
                        alt={`Foto da aeronave ${form.registration || "a cadastrar"}`}
                        pending={photoField.pending}
                        error={photoField.error}
                        disabled={saving}
                        onSelect={photoField.select}
                        onRemove={photoField.remove}
                    />
                </div>
            </section>

            <section className='form-card'>
                <h2>Alocação e situação</h2>
                <div className='form-grid'>
                    <div className={fieldClass("baseCode")}>
                        <label htmlFor="baseCode">Base de manutenção</label>
                        <select id="baseCode" value={form.baseCode}
                            onChange={(e) => setField("baseCode", e.target.value)}
                            aria-invalid={!!errors.baseCode} aria-describedby="baseCode-error">
                            <option value="">Selecione...</option>
                            {reference.bases.map((base) => (
                                <option key={base.code} value={base.code}>
                                    {base.code} - {base.name} ({base.city}/{base.state})
                                </option>
                            ))}
                        </select>
                        {errorText("baseCode")}
                    </div>
                    <div className={fieldClass("status")}>
                        <label htmlFor="status">Status</label>
                        <select id="status" value={form.status}
                            onChange={(e) => setField("status", e.target.value)}
                            aria-invalid={!!errors.status} aria-describedby="status-error">
                            {reference.statuses.map((s) => (
                                <option key={s.code} value={s.code}>{s.label}</option>
                            ))}
                        </select>
                        {errorText("status")}
                    </div>
                </div>
            </section>

            <section className='form-card'>
                <h2>Horas e ciclos acumulados</h2>
                <p className='hint'>
                    {isEdit
                        ? "Altere somente para corrigir o cadastro. Toda alteração fica registrada na auditoria."
                        : "Informe o total acumulado até hoje. Aeronave nova: deixe 0."}
                </p>
                <div className='form-grid'>
                    <div className={fieldClass("totalFlightHours")}>
                        <label htmlFor="totalFlightHours">Horas totais de voo (TSN)</label>
                        <input id="totalFlightHours" inputMode="decimal" value={form.totalFlightHours} maxLength={11}
                            onChange={(e) => setField("totalFlightHours", e.target.value)}
                            aria-invalid={!!errors.totalFlightHours} aria-describedby="totalFlightHours-error" />
                        {errorText("totalFlightHours")}
                    </div>
                    <div className={fieldClass("totalCycles")}>
                        <label htmlFor="totalCycles">Ciclos totais (CSN)</label>
                        <input id="totalCycles" inputMode="numeric" value={form.totalCycles} maxLength={9}
                            onChange={(e) => setField("totalCycles", e.target.value)}
                            aria-invalid={!!errors.totalCycles} aria-describedby="totalCycles-error" />
                        {errorText("totalCycles")}
                    </div>
                </div>
            </section>

            <div className='form-actions'>
                <Botao onClick={onCancel} disabled={saving}>Cancelar</Botao>
                <Botao
                    type="submit"
                    variant="primary"
                    loading={saving}
                    loadingText="Salvando..."
                    disabled={!hasChanges}
                    title={hasChanges ? undefined : "Nenhuma alteração para salvar"}
                >
                    {isEdit ? "Salvar alterações" : "Cadastrar aeronave"}
                </Botao>
            </div>

            {confirming && (
                <ConfirmChangesModal
                    aircraft={aircraft}
                    changes={changes}
                    warnFlightData={changedFields.includes("totalFlightHours") || changedFields.includes("totalCycles")}
                    saving={saving}
                    onConfirm={save}
                    onClose={() => setConfirming(false)}
                />
            )}
        </form>
    )
}

AircraftForm.propTypes = {
    token: PropTypes.string.isRequired,
    aircraft: PropTypes.shape({
        id: PropTypes.number.isRequired,
        registration: PropTypes.string.isRequired,
        manufacturer: PropTypes.string.isRequired,
        model: PropTypes.string.isRequired,
        serialNumber: PropTypes.string.isRequired,
        baseCode: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        totalFlightHours: PropTypes.number.isRequired,
        totalCycles: PropTypes.number.isRequired,
        hasPhoto: PropTypes.bool.isRequired,
    }),
    reference: PropTypes.shape({
        bases: PropTypes.arrayOf(PropTypes.shape({
            code: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            city: PropTypes.string.isRequired,
            state: PropTypes.string.isRequired,
        })).isRequired,
        statuses: PropTypes.arrayOf(PropTypes.shape({
            code: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })).isRequired,
    }).isRequired,
    onSaved: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onSessionExpired: PropTypes.func.isRequired,
}

export default AircraftForm
