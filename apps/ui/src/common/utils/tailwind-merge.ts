import { twMerge } from 'tailwind-merge'

export const tailwindMerge = (...inputs: string[]) => {
  return twMerge(inputs)
}
