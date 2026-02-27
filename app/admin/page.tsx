'use client'

import { trpc } from '@/lib/trpc/client'
import Link from 'next/link'
import { useState } from 'react'

export default function AdminPage() {
  const { data: pending, refetch } = trpc.agents.getPendingContributions.useQuery()
  const reviewMutation = trpc.agents.reviewContribution.useMutation({
    onSuccess: () => refetch(),
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-900">← Back</Link>
        <h1 className="font-semibold text-lg">AI Review Queue</h1>
        {pending && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{pending.length} pending</span>}
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {!pending || pending.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-4xl mb-4">✅</p>
            <p>No pending contributions. The queue is clear!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((contribution) => {
              let parsedData: Record<string, unknown> = {}
              try { parsedData = JSON.parse(contribution.proposedData) } catch {}

              return (
                <div key={contribution.id} className="bg-white rounded-xl border p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        AI Suggested
                      </span>
                      <p className="text-xs text-slate-500 mt-1">by {contribution.createdBy} • {new Date(contribution.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => reviewMutation.mutate({ id: contribution.id, action: 'accept' })}
                        disabled={reviewMutation.isPending}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => reviewMutation.mutate({ id: contribution.id, action: 'reject' })}
                        disabled={reviewMutation.isPending}
                        className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                  <pre className="bg-slate-50 rounded-lg p-3 text-xs overflow-x-auto">
                    {JSON.stringify(parsedData, null, 2)}
                  </pre>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
