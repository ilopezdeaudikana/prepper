import * as React from 'react'
import { Separator as SeparatorPrimitive } from 'radix-ui'

import { tailwindMerge } from '@/common/utils/tailwind-merge'

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentPropsWithRef<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot='separator'
      decorative={decorative}
      orientation={orientation}
      className={tailwindMerge(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className ?? ''
      )}
      {...props}
    />
  )
}

export { Separator }
