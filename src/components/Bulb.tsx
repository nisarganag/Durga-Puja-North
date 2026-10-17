import { useRouteModel } from '../data/model'
import type { Stop } from '../data/route'
import type { StopState } from '../lib/routeState'
import { HomeIcon, MetroIcon, TrainIcon } from './Icons'

interface Props {
  stop: Stop
  state: StopState
  size?: 'sm' | 'md'
  /** Plays the switch-on flicker, for the stop that was just marked. */
  flicker?: boolean
}

export function Bulb({ stop, state, size = 'md', flicker = false }: Props) {
  const n = useRouteModel().numbers.get(stop.id)
  const iconSize = size === 'sm' ? 14 : 16
  let content
  if (n !== undefined) content = n
  else if (stop.kind === 'start') content = <MetroIcon size={iconSize} />
  else if (stop.kind === 'end') content = <TrainIcon size={iconSize} />
  else content = <HomeIcon size={iconSize} />

  return (
    <span className={`bulb bulb-${size} is-${state} kind-${stop.kind}${flicker ? ' flicker' : ''}`} aria-hidden="true">
      <span className="bulb-cap" />
      <span className="bulb-glass">{content}</span>
    </span>
  )
}
