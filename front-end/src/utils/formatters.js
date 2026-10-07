// Formatação de datas e números no padrão brasileiro, sempre no horário de Brasília
const TIME_ZONE = "America/Sao_Paulo"

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, dateStyle: "short", timeStyle: "short" })
const clockFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" })
const hoursFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const integerFormat = new Intl.NumberFormat("pt-BR")

/** "06/10/2026 21:54" */
export const formatDateTime = (value) => dateTimeFormat.format(new Date(value))

/** "21:54" */
export const formatClock = (date) => clockFormat.format(date)

/** Horas de voo com uma casa decimal: "8.742,6" */
export const formatHours = (value) => hoursFormat.format(value)

/** Inteiro com separador de milhar: "24.909" */
export const formatInteger = (value) => integerFormat.format(value)
