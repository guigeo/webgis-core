import * as Tooltip from '@radix-ui/react-tooltip'
import type { PropsWithChildren, ReactNode } from 'react'

interface AppTooltipProps extends PropsWithChildren {
  label: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function AppTooltipProvider({ children }: PropsWithChildren) {
  return <Tooltip.Provider delayDuration={350}>{children}</Tooltip.Provider>
}

export function AppTooltip({
  children,
  label,
  side = 'right',
}: AppTooltipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={8}
          className="z-50 rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
        >
          {label}
          <Tooltip.Arrow className="fill-slate-950" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
