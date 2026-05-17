import { Badge, Card } from 'antd'
import { CodeArea } from '../../common/components/code-area'

const helloCode = `
/**
 * TOPIC: Javascipt
 * LEVEL: Easy
 * 
 * TASK:
 * Create a function 'doubleNumbers' that takes an array of numbers
 * and returns a new array where every number is multiplied by 2.
 * 
 * CONSTRAINTS:
 * - Do not mutate the original array.
 * - Use the built-in .map() method.
 */

function doubleNumbers(numbers: number[]): number[] {
  // TODO: Implement the transformation logic here
  return [];
}

// Example usage:
// doubleNumbers([1, 2, 3]); // Expected output: [2, 4, 6]
`

const solutionCode = `
/**
 * SOLUTION: Array Transformation
 * 
 * Using the .map() method ensures that a new array is created
 * without modifying the input, adhering to functional 
 * programming principles.
 */

function doubleNumbers(numbers: number[]): number[] {
  return numbers.map((num) => num * 2);
}

// Validation:
// const input = [10, 20, 30];
// const result = doubleNumbers(input); 
// console.log(result); // [20, 40, 60]
`
export const ChallengeEmpty = ({ isQuestion }: { isQuestion?: boolean }) => {
  const cardStyles = { body:'bg-orange-200 opacity-80 text-gray-900'}
  return (
    <div className="flex flex-col gap-2 overflow-auto min-h-full p-2">
      {isQuestion && (
        <Badge.Ribbon text="Start">
          <Card title="Welcome to your personalized coding challenge" size="small" 
            classNames={cardStyles} 
            styles={{header:{background: 'var(--color-orange-200)', fontWeight: 200, fontSize: 'var(--text-base)', color: 'var(--color-gray-700)'}}}
          >
            To begin, select <strong>Configure new challenge</strong> or <strong>Review previous challenges</strong>. 
            Once the environment loads, use the editor on the right-hand panel to write your solution. 
            You can submit your work using the <strong>Submit</strong> button located in the top navigation bar.
          </Card>
        </Badge.Ribbon>
      )}
      <div style={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
        <CodeArea
          value={isQuestion ? helloCode : solutionCode}
          readOnly={true}
          id={isQuestion ? 'hello-code' : 'solution-code'}
        />
      </div>
    </div>
  )
}
