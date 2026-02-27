import 'server-only'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@/server/routers'
import { headers } from 'next/headers'

export const serverClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/trpc`,
      transformer: superjson,
      async headers() {
        const h = await headers()
        return Object.fromEntries(h.entries())
      },
    }),
  ],
})
