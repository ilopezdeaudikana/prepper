import * as React from 'react'

import { tailwindMerge } from '@/common/utils/tailwind-merge'
import { Switch as SwitchPrimitive } from 'radix-ui'

export const Switch =({ className, name, ...props }: React.ComponentPropsWithRef<typeof SwitchPrimitive.Root>) => {
  return (
    <SwitchPrimitive.Root className={tailwindMerge(
      `relative h-[25px] w-[42px] rounded-full
        bg-[var(--color-foreground)]
        shadow-[0_2px_10px_var(--color-ring)]
        [-webkit-tap-highlight-color:rgba(0,0,0,0)]
        focus:shadow-[0_0_0_2px_var(--color-foreground)]
        data-[state=checked]:bg-foreground
        disabled:cursor-not-allowed disabled:opacity-50
        data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50`,
      className ?? ''
    )}
      name={name}
      {...props}>
      <SwitchPrimitive.Thumb className={
        `block h-[21px] w-[21px] rounded-full bg-[var(--color-background)]
        shadow-[0_2px_2px_var(--color-ring)]
        transition-transform duration-100
        translate-x-[2px] will-change-transform
        data-[state=checked]:translate-x-[19px]
        data-[disabled]:shadow-none`}   
      />
    </SwitchPrimitive.Root>
  )
}
