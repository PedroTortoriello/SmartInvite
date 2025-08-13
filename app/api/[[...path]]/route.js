import { NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseAdmin } from '../../../lib/supabase/server.js'
import { evolutionAPI } from '../../../lib/evolution.js'
import { renderTemplate, getEventVariables } from '../../../lib/utils/templates.js'
import { v4 as uuidv4 } from 'uuid'
import { getPlanForGuests } from '@/lib/billing/pricing.js'
// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

// Mapeia faixa de convidados -> price_id e rótulo
function getStripePriceByGuests(n) {
  if (n <= 25) {
    return { priceId: null, label: 'Grátis até 25', tier: 'free' }
  }
  if (n <= 50) {
    return { priceId: 'price_1RvU2uLRumVLvijpv4XZsJql', label: 'Mais de 25 (até 50)', tier: 'up_to_50' }
  }
  if (n <= 100) {
    return { priceId: 'price_1RvU4BLRumVLvijpdWM8GdRP', label: 'Mais de 50 (até 100)', tier: 'up_to_100' }
  }
  if (n <= 150) {
    return { priceId: 'price_1RvU5ZLRumVLvijpWrcx4A74', label: 'Até 150', tier: 'up_to_150' }
  }
  if (n <= 200) {
    return { priceId: 'price_1RvUQhLRumVLvijpTYgvmNiq', label: 'Até 200', tier: 'up_to_200' }
  }
  return { priceId: 'price_1RvURYLRumVLvijpG60lMbO3', label: '200+', tier: '200_plus' }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

    if (route.startsWith('/public/rsvp/') && method === 'GET') {
      const token = route.split('/')[3]
      const { data: event, error } = await createSupabaseAdmin()
        .from('events')
        .select('id, title, description, location, starts_at, rsvp_token')
        .eq('rsvp_token', token)
        .single()

      if (error || !event) {
        return handleCORS(NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json(event))
    }

    // Public RSVP page data
    if (route.startsWith('/public/event/') && method === 'GET') {
      const eventId = route.split('/')[3]
      
      const { data: event, error } = await supabase
        .from('events')
        .select('id, title, description, location, starts_at')
        .eq('id', eventId)
        .single()

      if (error) {
        return handleCORS(NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json(event))
    }

    // Confirma RSVP por token (rota pública)
// helper opcional: tenta atualizar o status para algo "confirmado"
async function tryUpgradeRsvpStatus(supabase, { eventId, guestId }) {
  // tente os que você deseja/imagina que existam no CHECK
  const CANDIDATES = ['confirmed', 'yes', 'accepted', 'attending', 'going', 'present', 'confirmado'];

  for (const status of CANDIDATES) {
    const { error } = await supabase
      .from('rsvps')
      .update({ status })
      .eq('event_id', eventId)
      .eq('guest_id', guestId);

    // se não houver erro, ótimo — status atualizado
    if (!error) return { ok: true, status };
    // se der erro por constraint, tenta o próximo
    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('check constraint') || msg.includes('invalid') || msg.includes('violates')) continue;

    // erro inesperado — retorna
    return { ok: false, error };
  }

  // nenhum dos candidatos foi aceito — seguimos com 'pending'
  return { ok: false, error: { message: 'Nenhum status alternativo foi aceito; RSVP permanece como pending.' } };
}

// POST /api/public/rsvp/confirm
if (route === '/public/rsvp/confirm' && method === 'POST') {
  const { token, name, companions } = await request.json();

  // validações básicas
  if (!token || String(token).trim() === '') {
    return handleCORS(NextResponse.json(
      { error: "Token é obrigatório" },
      { status: 400 }
    ));
  }
  if (!name || String(name).trim() === '') {
    return handleCORS(NextResponse.json(
      { error: "Nome é obrigatório" },
      { status: 400 }
    ));
  }

  const supabase = createSupabaseAdmin();

  // encontra o evento pelo rsvp_token
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, org_id')
    .eq('rsvp_token', token)
    .single();

  if (!event || eventError) {
    return handleCORS(NextResponse.json(
      { error: "Evento não encontrado" },
      { status: 404 }
    ));
  }

  // cria o convidado principal
  const { data: mainGuest, error: mainGuestError } = await supabase
    .from('guests')
    .insert([{
      org_id: event.org_id,
      event_id: event.id,
      name: String(name).trim(),
      email: null,     
      companion_of: null
    }])
    .select()
    .single();

  if (mainGuestError) {
    return handleCORS(NextResponse.json(
      { error: mainGuestError.message },
      { status: 400 }
    ));
  }

  // cria RSVP primeiro como 'pending' (valor aceito)
  const { error: rsvpInsertErr } = await supabase
    .from('rsvps')
    .insert([{
      event_id: event.id,
      guest_id: mainGuest.id,
      status: 'pending'
    }]);

  if (rsvpInsertErr) {
    return handleCORS(NextResponse.json(
      { error: rsvpInsertErr.message },
      { status: 400 }
    ));
  }

  // tenta atualizar para um status "confirmado"; se não der, mantém 'pending'
  await tryUpgradeRsvpStatus(supabase, {
    eventId: event.id,
    guestId: mainGuest.id
  });

  // normaliza acompanhantes (array de strings, sem vazios)
  const companionNames = Array.isArray(companions)
    ? companions.map(c => String(c ?? '').trim()).filter(Boolean)
    : [];

  const createdCompanions = [];
  for (const compName of companionNames) {
    // cria o guest do acompanhante
    const { data: compGuest, error: compGuestError } = await supabase
      .from('guests')
      .insert([{
        org_id: event.org_id,
        event_id: event.id,
        name: compName,
        email: null,
        companion_of: mainGuest.id
      }])
      .select()
      .single();

    if (compGuestError) {
      console.error('Erro ao criar acompanhante:', compName, compGuestError);
      continue;
    }

    createdCompanions.push(compGuest);

    // insere RSVP do acompanhante como 'pending' e tenta subir o status
    const { error: compRsvpInsertErr } = await supabase
      .from('rsvps')
      .insert([{
        event_id: event.id,
        guest_id: compGuest.id,
        status: 'pending'
      }]);

    if (!compRsvpInsertErr) {
      await tryUpgradeRsvpStatus(supabase, {
        eventId: event.id,
        guestId: compGuest.id
      });
    } else {
      console.error('Erro ao criar RSVP do acompanhante:', compName, compRsvpInsertErr);
    }
  }

  

  return handleCORS(NextResponse.json({
    message: "Presença confirmada com sucesso",
    guest: mainGuest,
    companions: createdCompanions
  }));
}

// Authentication helper
async function getAuthenticatedUser(request) {
  const supabase = createSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized - Please log in')
  }
  
  return user
}

// Get user's organization
async function getUserOrg(userId) {
  const supabase = createSupabaseAdmin()
  
  const { data: orgMember, error } = await supabase
    .from('org_members')
    .select(`
      org_id,
      role,
      organizations (
        id,
        name,
        owner_id,
        created_at
      )
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('getUserOrg error:', error)
    throw new Error(`Organization not found: ${error.message}`)
  }

  if (!orgMember || !orgMember.organizations) {
    throw new Error('Organization not found - user may not be a member of any organization')
  }

  return orgMember.organizations
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Public routes (no auth required)
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Event Management API" }))
    }

    // Auth routes
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { fullName, email, password, orgName } = body

      if (!fullName || !email || !password || !orgName) {
        return handleCORS(NextResponse.json(
          { error: "All fields are required" },
          { status: 400 }
        ))
      }

      const supabaseAdmin = createSupabaseAdmin()

      // Create user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (authError) {
        return handleCORS(NextResponse.json(
          { error: authError.message },
          { status: 400 }
        ))
      }

      const userId = authData.user.id

      // Create organization
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert([{
          name: orgName,
          owner_id: userId
        }])
        .select()
        .single()

      if (orgError) {
        throw new Error(`Failed to create organization: ${orgError.message}`)
      }

      // Create org membership
      const { error: memberError } = await supabaseAdmin
        .from('org_members')
        .insert([{
          org_id: org.id,
          user_id: userId,
          role: 'owner'
        }])

      if (memberError) {
        throw new Error(`Failed to create membership: ${memberError.message}`)
      }

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('users_profile')
        .insert([{
          id: userId,
          full_name: fullName,
          org_id: org.id
        }])

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }

      // Create Evolution instance
      try {
        const instanceData = await evolutionAPI.createInstance({ orgId: org.id })
        
        const webhookUrl = `${process.env.EVOLUTION_WEBHOOK_BASE}?secret=${process.env.EVOLUTION_WEBHOOK_SECRET}&org=${org.id}`
        
        const { error: instanceError } = await supabaseAdmin
          .from('evolution_instances')
          .insert([{
            org_id: org.id,
            instance_id: instanceData.instanceId,
            status: instanceData.status,
            qr_code: instanceData.qrCode,
            webhook_url: webhookUrl
          }])

        if (instanceError) {
          console.error('Failed to save instance:', instanceError)
        }
      } catch (evolutionError) {
        console.error('Evolution instance creation failed:', evolutionError)
        // Continue without failing registration
      }

      return handleCORS(NextResponse.json({
        message: "Registration successful",
        user: {
          id: userId,
          email,
          fullName
        },
        organization: org
      }))
    }

    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body

      const supabase = createSupabaseServer()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 400 }
        ))
      }

      return handleCORS(NextResponse.json({
        message: "Login successful",
        user: data.user
      }))
    }

    if (route === '/auth/logout' && method === 'POST') {
      const supabase = createSupabaseServer()
      const { error } = await supabase.auth.signOut()

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 400 }
        ))
      }

      return handleCORS(NextResponse.json({ message: "Logout successful" }))
    }

    // Protected routes - require authentication
    const user = await getAuthenticatedUser(request)
    const supabase = createSupabaseServer()

    if (route === '/me' && method === 'GET') {
      const supabaseAdmin = createSupabaseAdmin()
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      // Get organization separately if profile has org_id
      let organization = null
      if (profile?.org_id) {
        const { data: org, error: orgError } = await supabaseAdmin
          .from('organizations')
          .select('*')
          .eq('id', profile.org_id)
          .single()
          
        if (!orgError) {
          organization = org
        }
      }

      const { data: instance, error: instanceError } = await supabaseAdmin
        .from('evolution_instances')
        .select('*')
        .eq('org_id', profile?.org_id)
        .single()

      if (instanceError) {
        console.error('Instance fetch error:', instanceError)
      }

      return handleCORS(NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: profile?.full_name || user.user_metadata?.full_name || 'Unknown'
        },
        organization: organization,
        evolutionInstance: instance || null
      }))
    }

    // Events endpoints
    if (route === '/events' && method === 'GET') {
      const org = await getUserOrg(user.id)
      
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          guests (id),
          rsvps (id, status)
        `)
        .eq('org_id', org.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch events: ${error.message}`)
      }

      return handleCORS(NextResponse.json(events || []))
    }

if (route === '/events' && method === 'POST') {
  const org = await getUserOrg(user.id)
  const body = await request.json()
  const {
    title,
    description,
    location,
    startsAt,
    guests = 0,
  } = body

  if (!title || !startsAt) {
    return handleCORS(NextResponse.json(
      { error: "Title and start time are required" },
      { status: 400 }
    ))
  }

  const safeGuests = Number.isFinite(Number(guests)) ? Number(guests) : 0
  const { priceId, label, tier } = getStripePriceByGuests(safeGuests)
  const requiresPayment = !!priceId

  const rsvpToken = uuidv4()

  // cria evento
  const { data: event, error } = await supabase
    .from('events')
    .insert([{
      org_id: org.id,
      title,
      description,
      location,
      starts_at: startsAt,
      created_by: user.id,
      status: requiresPayment ? 'rascunho' : 'ativo',
      rsvp_token: rsvpToken,
      guests_planned: safeGuests,
      billing_status: requiresPayment ? 'pending_payment' : 'free',
      billing_tier: tier
    }])
    .select()
    .single()

  if (error) {
    return handleCORS(NextResponse.json(
      { error: `Failed to create event: ${error.message}` },
      { status: 500 }
    ))
  }

  // grátis → retorna direto
  if (!requiresPayment) {
    return handleCORS(NextResponse.json({
      requiresPayment: false,
      event
    }, { status: 200 }))
  }

  // pago → cria sessão com PRICE correspondente
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/Pages`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/Pages`,
      payment_method_types: ['card'],
      locale: 'pt-BR',
      currency: 'brl',
      line_items: [
        { price: priceId, quantity: 1 }
      ],
      metadata: {
        event_id: event.id,
        org_id: org.id,
        guests: String(safeGuests),
        tier,
      },
    })

    await supabase
      .from('events')
      .update({
        stripe_session_id: session.id
      })
      .eq('id', event.id)

    return handleCORS(NextResponse.json({
      requiresPayment: true,
      checkoutUrl: session.url,
      event
    }, { status: 200 }))
  } catch (e) {
    console.error('Stripe checkout error:', e)
    return handleCORS(NextResponse.json(
      { error: 'Falha ao criar sessão de pagamento.' },
      { status: 500 }
    ))
  }
}



    // Single event endpoint
    if (route.startsWith('/events/') && route.split('/').length === 3 && method === 'GET') {
      const eventId = route.split('/')[2]
      const org = await getUserOrg(user.id)
      
      const { data: event, error } = await supabase
        .from('events')
        .select(`
          *,
          guests (*),
          rsvps (*),
          messages (*)
        `)
        .eq('id', eventId)
        .eq('org_id', org.id)
        .single()

      if (error) {
        return handleCORS(NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json(event))
    }

    // Guests endpoints
    if (route === '/guests' && method === 'POST') {
      const org = await getUserOrg(user.id)
      const body = await request.json()
      const { eventId, name } = body

      if (!eventId || !name ) {
        return handleCORS(NextResponse.json(
          { error: "Event ID, name" },
          { status: 400 }
        ))
      }

      // Verify event belongs to org
      const { data: event } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .eq('org_id', org.id)
        .single()

      if (!event) {
        return handleCORS(NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        ))
      }

      const { data: guest, error } = await supabase
        .from('guests')
        .insert([{
          org_id: org.id,
          event_id: eventId,
          name,
          email,
          tag
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create guest: ${error.message}`)
      }

      // Create default RSVP
      await supabase
        .from('rsvps')
        .insert([{
          event_id: eventId,
          guest_id: guest.id,
          status: 'pending'
        }])

      return handleCORS(NextResponse.json(guest))
    }

    // Templates endpoints
    if (route === '/templates' && method === 'GET') {
      const org = await getUserOrg(user.id)
      
      const { data: templates, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('org_id', org.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch templates: ${error.message}`)
      }

      return handleCORS(NextResponse.json(templates || []))
    }

    if (route === '/templates' && method === 'POST') {
      const org = await getUserOrg(user.id)
      const body = await request.json()
      const { name, bodyText, channel = 'whatsapp' } = body

      if (!name || !bodyText) {
        return handleCORS(NextResponse.json(
          { error: "Name and body text are required" },
          { status: 400 }
        ))
      }

      const { data: template, error } = await supabase
        .from('message_templates')
        .insert([{
          org_id: org.id,
          name,
          body_text: bodyText,
          channel
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create template: ${error.message}`)
      }

      return handleCORS(NextResponse.json(template))
    }

    // Send messages endpoint
    if (route === '/messages/send' && method === 'POST') {
      const org = await getUserOrg(user.id)
      const body = await request.json()
      const { eventId, templateId, guestIds } = body

      if (!eventId || !templateId || !guestIds?.length) {
        return handleCORS(NextResponse.json(
          { error: "Event ID, template ID, and guest IDs are required" },
          { status: 400 }
        ))
      }

      // Get event, template, and guests
      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('org_id', org.id)
        .single()

      const { data: template } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .eq('org_id', org.id)
        .single()

      const { data: guests } = await supabase
        .from('guests')
        .select('*')
        .in('id', guestIds)
        .eq('org_id', org.id)

      if (!event || !template || !guests?.length) {
        return handleCORS(NextResponse.json(
          { error: "Event, template, or guests not found" },
          { status: 404 }
        ))
      }

      // Get Evolution instance
      const { data: instance } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('org_id', org.id)
        .single()

      if (!instance) {
        return handleCORS(NextResponse.json(
          { error: "WhatsApp instance not configured" },
          { status: 400 }
        ))
      }

      const results = []

      // Send messages to each guest
      for (const guest of guests) {
        try {
          const variables = getEventVariables(event, guest)
          const message = renderTemplate(template.body_text, variables)

          const sendResult = await evolutionAPI.sendMessage({
            instanceId: instance.instance_id,
            to: guest.phone_e164,
            message
          })

          // Log message
          await supabase
            .from('messages')
            .insert([{
              org_id: org.id,
              event_id: eventId,
              guest_id: guest.id,
              status: 'sent',
              payload: {
                templateId,
                message,
                evolutionResponse: sendResult
              }
            }])

          results.push({
            guestId: guest.id,
            guestName: guest.name,
            status: 'sent',
            messageId: sendResult.messageId
          })
        } catch (error) {
          console.error(`Failed to send message to ${guest.name}:`, error)
          
          await supabase
            .from('messages')
            .insert([{
              org_id: org.id,
              event_id: eventId,
              guest_id: guest.id,
              status: 'failed',
              payload: {
                templateId,
                error: error.message
              }
            }])

          results.push({
            guestId: guest.id,
            guestName: guest.name,
            status: 'failed',
            error: error.message
          })
        }
      }

      return handleCORS(NextResponse.json({
        message: "Messages processed",
        results
      }))
    }

    // Dashboard endpoint
    if (route === '/dashboard' && method === 'GET') {
      const org = await getUserOrg(user.id)
      
      // Get dashboard stats
      const [eventsResult, messagesResult, rsvpsResult] = await Promise.all([
        supabase
          .from('events')
          .select('id, status, created_at')
          .eq('org_id', org.id),
        supabase
          .from('messages')
          .select('status')
          .eq('org_id', org.id),
        supabase
          .from('rsvps')
          .select('status')
          .eq('event_id', supabase.from('events').select('id').eq('org_id', org.id))
      ])

      const events = eventsResult.data || []
      const messages = messagesResult.data || []

      const stats = {
        totalEvents: events.length,
        activeEvents: events.filter(e => e.status === 'active').length,
        totalGuests: 0, // Will be calculated separately
        messagesSent: messages.filter(m => m.status === 'sent').length,
        responseRate: 0, // Will be calculated
        recentEvents: events.slice(0, 5)
      }

      return handleCORS(NextResponse.json(stats))
    }

    // Webhook endpoint for Evolution API
    if (route === '/webhooks/evolution' && method === 'POST') {
      const secret = request.nextUrl.searchParams.get('secret')
      const orgId = request.nextUrl.searchParams.get('org')

      if (!evolutionAPI.validateWebhookSecret(secret)) {
        return handleCORS(NextResponse.json(
          { error: "Invalid webhook secret" },
          { status: 401 }
        ))
      }

      const body = await request.json()
      console.log('Evolution webhook received:', { orgId, event: body.event, data: body.data })

      // Handle different webhook events
      if (body.event === 'connection.update') {
        // Update instance status
        const supabaseAdmin = createSupabaseAdmin()
        await supabaseAdmin
          .from('evolution_instances')
          .update({
            status: body.data.state,
            qr_code: body.data.qrcode?.base64,
            updated_at: new Date().toISOString()
          })
          .eq('org_id', orgId)
      }

      if (body.event === 'messages.upsert') {
        // Handle incoming messages (for RSVP processing)
        console.log('Incoming message:', body.data)
        // TODO: Process RSVP responses from guests
      }

      return handleCORS(NextResponse.json({ received: true }))
    }



    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    
    if (error.message === 'Unauthorized - Please log in') {
      return handleCORS(NextResponse.json(
        { error: error.message },
        { status: 401 }
      ))
    }
    
    return handleCORS(NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute