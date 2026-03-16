import { Topic, Level } from "@repo/shared-types"

const getRandomValue = <T,>(arr: readonly T[]): T => {
  if (arr.length === 0) throw new Error('Cannot pick from an empty array')
  const index = Math.floor(Math.random() * arr.length)
  return arr[index]
}

export const getRandomTopicAndLevel = () => ({
  topic: getRandomValue(Object.values(Topic)),
  level: getRandomValue(Object.values(Level))
})
