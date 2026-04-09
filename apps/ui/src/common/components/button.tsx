import * as React from 'react'

import { tailwindMerge } from '@/common/utils/tailwind-merge'

const buttonVariants = 'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5'


function Button({
  className,
  asChild = false,
  ...props
}: React.ComponentPropsWithRef<'button'> & {
    asChild?: boolean
  }) {
  const Comp = 'button'

  return (
    <Comp
      data-slot='button'
      className={tailwindMerge(buttonVariants, className ?? '')}
      {...props}
    />
  )
}

export { Button, buttonVariants }
