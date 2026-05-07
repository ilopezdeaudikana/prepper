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
  return (
    <div className="flex flex-col gap-2 overflow-auto min-h-full">
      {isQuestion && (
        <p>
          Welcome to your personalized coding environment. Below you will find a
          code challenge tailored to the topic and level selected in the
          configuration panel. To begin, click on{' '}
          <strong>Configure new challenge</strong> button to generate your first task.
        </p>
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
