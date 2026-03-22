import * as React from 'react'

import { tailwindMerge } from '@/common/utils/tailwind-merge'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { Check } from 'lucide-react'

export const  Checkbox = ({ className, name, ...props }: React.ComponentPropsWithRef<typeof CheckboxPrimitive.Root>) => {
  return (
    <CheckboxPrimitive.Root className={tailwindMerge(
      `flex items-center justify-center h-[20px] w-[20px] rounded-sm
        bg-[var(--color-white)]
        shadow-[0_2px_10px_var(--color-ring)]
        [-webkit-tap-highlight-color_var(--color-foreground)]
        focus:shadow-[0_0_0_2px_var(--color-foreground)]
        hover:shadow-[0_0_0_2px_var(--color-ring)]`,
      className ?? ''
    )}
      name={name}
      {...props}>
      <CheckboxPrimitive.Indicator
        className='flex h-[14px] w-[14px] items-center justify-center'
      >
        <Check size={14} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
