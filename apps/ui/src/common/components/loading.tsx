import * as React from 'react'

import { tailwindMerge } from '@/common/utils/tailwind-merge'

function Loading({
  className,
  ...props
}: React.ComponentPropsWithRef<'div'>) {
  return (
    <div
      className='absolute top-1/3 left-1/2 w-lvh h-lvh'
    >
      <span
        data-slot='loading-spinner'
        role='status'
        aria-label='loading spinner'
        className={tailwindMerge(
          'inline-block animate-spin rounded-full border-current border-t-transparent',
          'size-4 border-2',
          className ?? ''
        )}
        {...props}
      />
    </div>
  )
}

export { Loading }
