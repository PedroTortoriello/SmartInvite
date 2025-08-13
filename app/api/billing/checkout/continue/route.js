import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseAdmin } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

export async function POST(req) {
  try {
    const { eventId, successRedirect='/Pages', cancelRedirect='/Pages' } = await req.json()
    if (!eventId) return NextResponse.json({ error: 'eventId é obrigatório' }, { status: 400 })

    const supabase = createSupabaseAdmin()
    const { data: ev, error } = await supabase
      .from('events')
      .select('id, org_id, guests_planned, billing_status, stripe_session_id')
      .eq('id', eventId)
      .single()
    if (error || !ev) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

    // se já existir sessão aberta, reutiliza
    if (ev.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(ev.stripe_session_id)
        if (session.status === 'open' && session.url) return NextResponse.json({ checkoutUrl: session.url })
        if (session.status === 'complete') return NextResponse.json({ alreadyPaid: true })
      } catch {}
    }

    // decide o price_id a partir de guests_planned
    const n = Number(ev.guests_planned) || 0
    const priceId =
      n <= 25 ? null :
      n <= 50 ? 'price_1RvU2uLRumVLvijpv4XZsJql' :
      n <= 100 ? 'price_1RvU4BLRumVLvijpdWM8GdRP' :
      n <= 150 ? 'price_1RvU5ZLRumVLvijpWrcx4A74' :
      n <= 200 ? 'price_1RvUQhLRumVLvijpTYgvmNiq' :
                 'price_1RvURYLRumVLvijpG60lMbO3'

    if (!priceId) return NextResponse.json({ error: 'Plano gratuito não requer pagamento' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { event_id: ev.id, org_id: ev.org_id }
    })

    await supabase.from('events').update({ stripe_session_id: session.id, billing_status: 'pending_payment' }).eq('id', ev.id)
    return NextResponse.json({ checkoutUrl: session.url })
  } catch (e) {
    console.error('continue checkout error:', e)
    return NextResponse.json({ error: 'Não foi possível abrir o checkout.' }, { status: 500 })
  }
}
