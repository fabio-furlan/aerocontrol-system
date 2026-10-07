import "./marca.css"

// Monograma FB construído geometricamente (sem fonte): as pontas do F têm corte
// enflechado, como ponta de asa, e o braço do meio é âmbar. A faixa na base da
// placa remete à faixa de identificação pintada nas aeronaves.
const Logo = () => (
    <svg className='logo-mark' viewBox="0 0 64 64" aria-hidden="true">
        <defs>
            <clipPath id="logo-clip">
                <rect width="64" height="64" rx="7" />
            </clipPath>
        </defs>
        <g clipPath="url(#logo-clip)">
            <rect width="64" height="64" fill="#fff" />
            <rect y="54" width="64" height="4" fill="#e0a526" />
            <rect y="58" width="64" height="6" fill="#1f3a5f" />
        </g>
        <g transform="translate(11.6 8.8) scale(0.8)">
            <polygon points="0,9 22,9 19,14 5,14 5,39 0,39" fill="#1f3a5f" />
            <polygon points="5,21 17,21 14,26 5,26" fill="#e0a526" />
            <path
                d="M30.5 9 V39 M28 11.5 H41 A6 6 0 0 1 41 23.5 H30.5 M30.5 23.5 H42 A6.5 6.5 0 0 1 42 36.5 H28"
                fill="none"
                stroke="#1f3a5f"
                strokeWidth="5"
            />
        </g>
    </svg>
)

export default Logo
