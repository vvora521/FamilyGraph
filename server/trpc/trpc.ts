import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import type { Context } from './context'
import type { Role } from '@/lib/types'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})

export const contributorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role !== 'contributor' && ctx.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Contributor access required' })
  }
  return next({ ctx })
})

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }
  return next({ ctx })
})

export function requireRole(role: Role, ctx: Context) {
  const roleHierarchy: Record<Role, number> = { viewer: 0, contributor: 1, admin: 2 }
  if ((roleHierarchy[ctx.role] ?? -1) < roleHierarchy[role]) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
}
