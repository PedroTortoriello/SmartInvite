import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPlanForGuests } from '@/lib/billing/pricing'
import { createSupabaseAdmin } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export async function POST(req) {
  try {
    const { eventId, orgId, guests, successRedirect = '/', cancelRedirect = '/' } = await req.json()

    if (!eventId || !orgId || !Number.isFinite(Number(guests))) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const plan = getPlanForGuests(Number(guests))
    if (!plan.requiresPayment) {
      return NextResponse.json({ error: 'Plano não requer pagamento' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/Pages`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/Pages`,
      payment_method_types: ['card'],
      locale: 'pt-BR',
      currency: 'brl',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'SmartInvite — Plano por evento',
              description: `${plan.label} (até ${guests} convidados)`,
            },
            unit_amount: plan.unit_amount, // em centavos
          },
          quantity: 1,
        },
      ],
      metadata: {
        event_id: eventId,
        org_id: orgId,
        guests: String(guests),
        tier: plan.tier,
      },
    })

    // Marca evento como pendente de pagamento
    const supabase = createSupabaseAdmin()
    await supabase
      .from('events')
      .update({ billing_status: 'pending_payment' })
      .eq('id', eventId)

    return NextResponse.json({ checkoutUrl: session.url }, { status: 200 })
  } catch (err) {
    console.error('checkout error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar checkout' }, { status: 500 })
  }
}
