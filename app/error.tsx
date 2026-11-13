'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.warn('App error handled by boundary:', error?.message || error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center text-white p-4">
      <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
      <p className="text-gray-400 mb-6 text-sm max-w-md text-center">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all font-medium text-sm shadow-md"
      >
        Try Again
      </button>
    </div>
  )
}
