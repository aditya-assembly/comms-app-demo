interface LogoProps { size?: number }

const WAVE_BARS: [number, number][] = [
  [1.5,   8],
  [6,    18],
  [10.5, 12],
  [15,   32],
  [19.5, 44],
  [24,   22],
  [28.5, 38],
  [33,   16],
  [37.5, 26],
  [42,   10],
  [46.5,  6],
]
const BAR_W = 3

export function LogoVoiceWave({ size = 48 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vw-grad" x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B95F0" />
          <stop offset="55%" stopColor="#4F59CC" />
          <stop offset="100%" stopColor="#3140A8" />
        </linearGradient>
      </defs>
      {WAVE_BARS.map(([x, h], i) => (
        <rect key={i} x={x} y={24 - h / 2} width={BAR_W} height={h} rx={BAR_W / 2}
          fill="url(#vw-grad)" opacity={h < 14 ? 0.45 : h < 24 ? 0.75 : 1} />
      ))}
    </svg>
  )
}

export function LogoVoiceWaveIcon({ size = 48 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vwi-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5C65D8" />
          <stop offset="100%" stopColor="#3540B0" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="url(#vwi-bg)" />
      {WAVE_BARS.map(([x, h], i) => (
        <rect key={i} x={x} y={24 - h / 2} width={BAR_W} height={h} rx={BAR_W / 2}
          fill="white" opacity={h < 14 ? 0.3 : h < 24 ? 0.6 : 1} />
      ))}
    </svg>
  )
}
