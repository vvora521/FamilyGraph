import { auth } from '@clerk/nextjs/server'
import { getSignedUploadParams } from '@/lib/cloudinary/upload'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const signRequestSchema = z.object({
  personId: z.string().uuid(),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await req.json()
  const parsed = signRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid personId' }, { status: 400 })
  }
  
  const params = getSignedUploadParams(parsed.data.personId)
  return NextResponse.json(params)
}
