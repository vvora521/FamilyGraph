import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Handle Clerk webhook events for notifications
  // In production, verify the webhook signature with svix
  const body = await req.json()
  
  if (body.type === 'user.created') {
    console.log('New user created:', body.data.id)
    // Could send welcome email or create initial contributor node
  }

  return NextResponse.json({ received: true })
}
