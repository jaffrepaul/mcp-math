import { useState } from 'react'
import * as Sentry from "@sentry/react";

interface QuizState {
  problem: string
  correctAnswer: number
  userAnswer: string
  feedback: string | null
  score: number
  totalAttempts: number
}

function App() {
  const [quizState, setQuizState] = useState<QuizState>({
    problem: '',
    correctAnswer: 0,
    userAnswer: '',
    feedback: null,
    score: 0,
    totalAttempts: 0,
  })

  // Generate a random arithmetic problem
  const generateProblem = () => {
    const operators = ['+', '-', '*', '/']
    const operator = operators[Math.floor(Math.random() * operators.length)]

    let num1: number, num2: number

    // Generate appropriate numbers based on operator
    switch (operator) {
      case '+':
      case '-':
        num1 = Math.floor(Math.random() * 50) + 1
        num2 = Math.floor(Math.random() * 50) + 1
        break
      case '*':
        num1 = Math.floor(Math.random() * 12) + 1
        num2 = Math.floor(Math.random() * 12) + 1
        break
      case '/':
        // Ensure division results in whole numbers
        num2 = Math.floor(Math.random() * 12) + 1
        num1 = num2 * (Math.floor(Math.random() * 12) + 1)
        break
      default:
        num1 = 1
        num2 = 1
    }

    const problem = `${num1} ${operator} ${num2}`

    // Calculate answer (in real app, this would be done by MCP server)
    let answer: number
    switch (operator) {
      case '+':
        answer = num1 + num2
        break
      case '-':
        answer = num1 - num2
        break
      case '*':
        answer = num1 * num2
        break
      case '/':
        answer = num1 / num2
        break
      default:
        answer = 0
    }

    setQuizState({
      ...quizState,
      problem,
      correctAnswer: answer,
      userAnswer: '',
      feedback: null,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const userAnswerNum = parseFloat(quizState.userAnswer)

    if (isNaN(userAnswerNum)) {
      setQuizState({
        ...quizState,
        feedback: 'Please enter a valid number',
      })
      return
    }

    const isCorrect = Math.abs(userAnswerNum - quizState.correctAnswer) < 0.01

    setQuizState({
      ...quizState,
      feedback: isCorrect
        ? '✓ Correct!'
        : `✗ Incorrect. The answer is ${quizState.correctAnswer}`,
      score: isCorrect ? quizState.score + 1 : quizState.score,
      totalAttempts: quizState.totalAttempts + 1,
    })
  }

  const handleNext = () => {
    generateProblem()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Math Quiz</h1>
          <p className="text-gray-600">Powered by MCP Math Server</p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm text-gray-700">
            <span>Score: <span className="font-semibold">{quizState.score}</span></span>
            <span>Total: <span className="font-semibold">{quizState.totalAttempts}</span></span>
            <span>
              Accuracy:
              <span className="font-semibold ml-1">
                {quizState.totalAttempts > 0
                  ? `${Math.round((quizState.score / quizState.totalAttempts) * 100)}%`
                  : 'N/A'}
              </span>
            </span>
          </div>
        </div>

        {!quizState.problem ? (
          <div className="text-center py-12">
            <button
              onClick={generateProblem}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105"
            >
              Start Quiz
            </button>

           {/* <button
            type="button"
            onClick={() => {
              throw new Error("Sentry Test Error");
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105"
          >
            Break the world
          </button> */}
          <button
            type="button"
            onClick={() => {
              Sentry.startSpan({ op: "test", name: "Example Frontend Span" }, () => {
                // setTimeout(() => {
                  throw new Error("Sentry Test Error");
                // }, 99);
              });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105"
          >
            Break the world more
          </button>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-600 text-sm mb-2">Solve this problem:</p>
              <p className="text-4xl font-bold text-gray-800 text-center">
                {quizState.problem}
              </p>
            </div>

            {quizState.feedback ? (
              <div className={`rounded-lg p-4 mb-6 ${
                quizState.feedback.startsWith('✓')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <p className="font-semibold text-center">{quizState.feedback}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mb-6">
                <div className="mb-4">
                  <label htmlFor="answer" className="block text-gray-700 text-sm font-semibold mb-2">
                    Your Answer:
                  </label>
                  <input
                    type="text"
                    id="answer"
                    value={quizState.userAnswer}
                    onChange={(e) => setQuizState({ ...quizState, userAnswer: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                    placeholder="Enter your answer"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  Submit Answer
                </button>
              </form>
            )}

            {quizState.feedback && (
              <button
                onClick={handleNext}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Next Problem
              </button>
            )}
          </>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Note: In production, the MCP server would evaluate answers.<br />
            This demo calculates locally for simplicity.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
