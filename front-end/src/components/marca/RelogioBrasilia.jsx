import { FiClock } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { formatClock } from '@/utils/formatters'
import "./marca.css"

const RelogioBrasilia = () => {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <span className='clock' title="Horário de Brasília (São Paulo - Brasil)">
            <FiClock /> {formatClock(now)} · SP - Brasil
        </span>
    )
}

export default RelogioBrasilia
