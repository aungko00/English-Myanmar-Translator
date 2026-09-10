import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center text-white p-4">
      <h2 className="text-4xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-gray-400 mb-8">The page you are looking for does not exist.</p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all font-medium"
      >
        Return Home
      </Link>
    </div>
  )
}
