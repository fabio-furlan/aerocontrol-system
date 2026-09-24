import { FiClock } from 'react-icons/fi'
import { useEffect, useState } from 'react'

const brasiliaTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
})

const BrasiliaClock = () => {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <span className='clock' title="Horário de Brasília (São Paulo - Brasil)">
            <FiClock /> {brasiliaTime.format(now)} · SP - Brasil
        </span>
    )
}

export default BrasiliaClock
