import { auth } from '@clerk/nextjs/server'
import { getSignedUploadParams } from '@/lib/cloudinary/upload'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { personId } = await req.json()
  if (!personId) return NextResponse.json({ error: 'personId required' }, { status: 400 })
  
  const params = getSignedUploadParams(personId)
  return NextResponse.json(params)
}
