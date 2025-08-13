import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseAdmin } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export const dynamic = 'force-dynamic' // garante body cru disponível no App Router (Node runtime)

export async function POST(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret ausente' }, { status: 500 })
  }

  let rawBody
  let sig

  try {
    rawBody = await req.text()
    sig = req.headers.get('stripe-signature')
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao ler o corpo da requisição' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error('Webhook signature verify failed:', err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Processa o evento
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const eventId = session?.metadata?.event_id

    if (eventId) {
      const supabase = createSupabaseAdmin()
      // Marca evento como pago/ativo (ajuste o status para o que você usa no banco)
      await supabase
        .from('events')
        .update({
          billing_status: 'paid',
          status: 'ativo', // seu app usa "ativo"
        })
        .eq('id', eventId)
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
