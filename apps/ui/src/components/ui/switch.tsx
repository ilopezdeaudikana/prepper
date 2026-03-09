import * as React from "react"

import { cn } from "@/lib/utils"
import { Switch } from 'radix-ui'

function Toggle({ className, id, ...props }: React.ComponentPropsWithRef<typeof Switch.Root>) {
  return (
    <Switch.Root className={cn(
      `relative h-[25px] w-[42px] rounded-full
        bg-[var(--color-foreground)]
        shadow-[0_2px_10px_var(--color-ring)]
        [-webkit-tap-highlight-color:rgba(0,0,0,0)]
        focus:shadow-[0_0_0_2px_var(--color-foreground)]
        data-[state=checked]:bg-foreground`,
      className
    )}
      id={id}
      {...props}>
      <Switch.Thumb className={
        `block h-[21px] w-[21px] rounded-full bg-[var(--color-background)]
        shadow-[0_2px_2px_var(--color-ring)]
        transition-transform duration-100
        translate-x-[2px] will-change-transform
        data-[state=checked]:translate-x-[19px]`}   
      />
    </Switch.Root>
  )
}

export { Toggle }
