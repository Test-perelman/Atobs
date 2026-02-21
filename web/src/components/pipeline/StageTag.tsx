import { STAGE_CONFIG, Stage } from '../../lib/types'
import clsx from 'clsx'

interface Props {
  stage: Stage
  size?: 'sm' | 'md'
}

export default function StageTag({ stage, size = 'md' }: Props) {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.resume_received

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        config.bgColor,
        config.textColor,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      {config.label}
    </span>
  )
}
