'use client'

export default function DebtsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-black text-slate-950">
          Client Doit
        </h1>

        <p className="mt-3 text-slate-500">
          Système de crédit client activé.
        </p>

        <div className="mt-8 rounded-3xl bg-red-50 p-6">
          <p className="font-bold text-red-700">
            Les dettes clients apparaîtront ici.
          </p>
        </div>
      </div>
    </main>
  )
}