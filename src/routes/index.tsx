import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1D388B] to-[#0F0E7F]">
      <div className="rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-center font-manrope text-3xl font-800 text-[#1D388B]">
          AHA HEROES
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Achievement Points Tracking System
        </p>
      </div>
    </div>
  )
}
