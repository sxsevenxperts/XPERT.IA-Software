import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HotmartWebhookPayload {
  status: string
  event_type: string
  data: {
    id?: string
    buyer?: {
      email?: string
      name?: string
      cpf?: string
    }
    product?: {
      id?: string
      name?: string
    }
    subscription?: {
      status?: string
      recurrence?: string
    }
    payment?: {
      method?: string
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload: HotmartWebhookPayload = await req.json()

    // Handle purchase approved event
    if (payload.status === 'approved' || payload.event_type === 'PURCHASE_APPROVED') {
      const buyerEmail = payload.data?.buyer?.email
      const buyerCPF = payload.data?.buyer?.cpf
      const buyerName = payload.data?.buyer?.name
      const productId = payload.data?.product?.id
      const isAnnual = payload.data?.subscription?.recurrence === 'yearly'

      if (!buyerEmail || !buyerCPF) {
        return new Response(JSON.stringify({ error: 'Missing buyer email or CPF' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      const cpfClean = buyerCPF.replace(/\D/g, '')

      const expiresAt = new Date()
      if (isAnnual) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      }

      // Check if loja already exists
      const { data: existingLoja } = await supabase
        .from('lojas')
        .select('id')
        .eq('login_usuario', buyerEmail)
        .single()

      let lojaId: string
      let userId: string | null = null

      if (existingLoja) {
        lojaId = existingLoja.id
        await supabase
          .from('lojas')
          .update({
            ativo: true,
            plano: 'premium',
            data_expiracao: expiresAt.toISOString(),
            hotmart_product_id: productId
          })
          .eq('id', lojaId)
      } else {
        // Create Supabase Auth user (email auto-confirmed)
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: buyerEmail,
            password: cpfClean,
            email_confirm: true,
            user_metadata: { nome: buyerName || 'Loja', cpf: cpfClean }
          })

          if (authError) {
            // User might already exist in auth — try to get the id
            if (authError.message?.includes('already') || authError.message?.includes('exists')) {
              const { data: existingUser } = await supabase.auth.admin.listUsers()
              const found = existingUser?.users?.find(u => u.email === buyerEmail)
              if (found) userId = found.id
            }
            console.error('Auth user error:', authError.message)
          } else if (authUser?.user) {
            userId = authUser.user.id
          }
        } catch (authErr) {
          console.error('Auth creation exception:', authErr)
        }

        const { data: newLoja, error: insertError } = await supabase
          .from('lojas')
          .insert({
            user_id: userId,
            nome: buyerName || 'Loja Hotmart',
            nome_usuario: buyerName || 'Loja',
            login_usuario: buyerEmail,
            senha_usuario: cpfClean,
            ativo: true,
            plano: 'premium',
            data_expiracao: expiresAt.toISOString(),
            hotmart_product_id: productId
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('Error creating loja:', insertError)
          return new Response(JSON.stringify({
            error: 'Failed to create loja',
            details: insertError.message
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          })
        }

        lojaId = newLoja.id
      }

      // Log payment event
      try {
        await supabase.from('pagamentos').insert({
          loja_id: lojaId,
          valor: 'R$ 799,90',
          status: 'approved',
          metodo: payload.data?.payment?.method || 'hotmart',
          referencia_hotmart: payload.data?.id
        })
      } catch (_) {}

      return new Response(JSON.stringify({
        success: true,
        message: 'Loja created/updated successfully',
        loja_id: lojaId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Handle cancellation/refund
    if (payload.status === 'refused' || payload.event_type === 'PURCHASE_CANCELED' || payload.event_type === 'PURCHASE_REFUNDED') {
      const buyerEmail = payload.data?.buyer?.email
      if (buyerEmail) {
        await supabase.from('lojas').update({ ativo: false }).eq('login_usuario', buyerEmail)
      }
      return new Response(JSON.stringify({ success: true, message: 'Loja marked as inactive' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'Event received' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
