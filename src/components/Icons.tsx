import type { ReactNode, SVGProps } from 'react'
import type { Mode } from '../data/route'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const WalkIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="14" cy="4.5" r="1.8" />
    <path d="M13 8.5 11.5 13.5" />
    <path d="M11.5 13.5 10 17l-2.5 3.5" />
    <path d="m11.5 13.5 2 3 1 4" />
    <path d="M9.5 11.5 13 8.5l3 3" />
  </Svg>
)

export const BusIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="3" width="14" height="15.5" rx="2.5" />
    <path d="M5 11.5h14" />
    <path d="M9.5 6.5h5" />
    <path d="M8.5 15h.01M15.5 15h.01" />
    <path d="M7.5 18.5V21M16.5 18.5V21" />
  </Svg>
)

export const AutoIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 16.5V10a6 6 0 0 1 6-6h3.8a3 3 0 0 1 2.9 2.2l1.6 5.8h1.7a1.5 1.5 0 0 1 1.5 1.5v3" />
    <path d="M3.5 12h14.3" />
    <path d="M11.5 4v8" />
    <circle cx="6.5" cy="17" r="2" />
    <circle cx="18" cy="17" r="2" />
    <path d="M8.5 17H16" />
  </Svg>
)

export const TotoIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 5.5h12.5l3 4.5v6.5" />
    <path d="M3.5 5.5v11" />
    <path d="M3.5 12h11" />
    <path d="M14.5 12V5.5" />
    <circle cx="7" cy="17.5" r="2" />
    <circle cx="18" cy="17.5" r="1.6" />
    <path d="M9 17.5h7.4" />
  </Svg>
)

export const CabIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 15.5V13l2-.8L7.5 8h8.5l2.6 4.2 2.4.8v2.5" />
    <path d="M10 8V6h3.5v2" />
    <circle cx="7.5" cy="16" r="1.8" />
    <circle cx="16.5" cy="16" r="1.8" />
    <path d="M9.3 16h5.4M3 15.5h2.7M18.3 15.5h2.7" />
  </Svg>
)

export const MetroIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="3" width="12" height="14" rx="3" />
    <path d="M6 10h12" />
    <path d="M9 13.5h.01M15 13.5h.01" />
    <path d="m8.5 21 2-4M15.5 21l-2-4" />
  </Svg>
)

export const TrainIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2z" />
    <path d="M5 10h14M12 3v7" />
    <path d="M8.5 13.5h.01M15.5 13.5h.01" />
    <path d="m8 21 2-4M16 21l-2-4" />
  </Svg>
)

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 11 8-7 8 7" />
    <path d="M6 9.5V20h12V9.5" />
    <path d="M10 20v-5h4v5" />
  </Svg>
)

export const DirectionsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 20v-6a4 4 0 0 1 4-4h10" />
    <path d="m15 6 4 4-4 4" />
  </Svg>
)

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
)

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
)

export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12" />
    <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </Svg>
)

export const LocateIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="6.5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" />
  </Svg>
)

export const MapIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 4-5.5 2v14L9 18l6 2 5.5-2V4L15 6 9 4z" />
    <path d="M9 4v14M15 6v14" />
  </Svg>
)

export const ListIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </Svg>
)

export const MinusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 12h12" />
  </Svg>
)

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6v12M6 12h12" />
  </Svg>
)

export const SkipIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 7 6-7 6V6z" />
    <path d="M17 6v12" />
  </Svg>
)

export const UndoIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Svg>
)

const MODE_ICONS: Record<Mode, (p: IconProps) => ReactNode> = {
  walk: WalkIcon,
  bus: BusIcon,
  auto: AutoIcon,
  toto: TotoIcon,
  cab: CabIcon,
  metro: MetroIcon,
}

export function ModeIcon({ mode, ...rest }: IconProps & { mode: Mode }) {
  const Icon = MODE_ICONS[mode]
  return <Icon {...rest} />
}
