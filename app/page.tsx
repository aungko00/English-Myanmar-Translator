'use client'

import dynamic from 'next/dynamic'

const Translator = dynamic(() => import('@/components/Translator'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#212121]" />
})

export default function Home() {
  return (
    <main className="min-h-screen">
      <Translator />
    </main>
  )
}
