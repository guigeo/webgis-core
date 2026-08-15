import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { Button } from '../ui/button'
import { Sidebar } from './sidebar'
import type { ServiceStatus } from './types'

interface MobileNavigationProps {
  open: boolean
  serviceStatus: ServiceStatus
  onOpenChange: (open: boolean) => void
}

export function MobileNavigation({
  open,
  serviceStatus,
  onOpenChange,
}: MobileNavigationProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] md:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(88vw,20rem)] bg-white shadow-2xl outline-none md:hidden">
          <Dialog.Title className="sr-only">Navegação geográfica</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-2 top-2 z-10"
              aria-label="Fechar navegação"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </Dialog.Close>
          <Sidebar mobile serviceStatus={serviceStatus} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
