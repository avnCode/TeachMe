import QuizApp from '../components/QuizApp'

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <h1 className="text-3xl font-bold text-center my-6">TeachMe</h1>
      <QuizApp />
    </main>
  )
}