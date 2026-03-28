import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
      recurrence?: string // 'monthly' or 'yearly'
    }
    payment?: {
      method?: string
    }
  }
}

serve(async (req) => {
  // Only handle POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
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
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Remove CPF formatting (if any) - keep only numbers
      const cpfClean = buyerCPF.replace(/\D/g, '')

      // Calculate expiration date
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
        // Update existing loja subscription
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
        // Create Supabase Auth user first
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: buyerEmail,
            password: cpfClean, // CPF/CNPJ as password
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              nome: buyerName || 'Loja',
              cpf: cpfClean
            }
          })

          if (authError) {
            console.error('Error creating auth user:', authError)
            // Continue even if auth user creation fails, just create loja record
          } else if (authUser) {
            userId = authUser.user.id
          }
        } catch (authErr) {
          console.error('Auth creation exception:', authErr)
          // Continue even if auth user creation fails
        }

        // Create new loja
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
          console.error('Attempted data:', {
            user_id: userId,
            login_usuario: buyerEmail,
            senha_usuario: cpfClean,
            nome_usuario: buyerName,
            ativo: true,
            plano: 'premium',
            data_expiracao: expiresAt.toISOString(),
            hotmart_product_id: productId
          })
          return new Response(JSON.stringify({
            error: 'Failed to create loja',
            details: insertError.message || insertError
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        lojaId = newLoja.id
      }

      // Log payment event
      await supabase
        .from('pagamentos')
        .insert({
          loja_id: lojaId,
          valor: payload.data?.payment?.method ? 'R$ 799,90' : null,
          status: 'approved',
          metodo: payload.data?.payment?.method || 'hotmart',
          referencia_hotmart: payload.data?.id
        })

      return new Response(JSON.stringify({
        success: true,
        message: 'Loja created/updated successfully',
        loja_id: lojaId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle purchase canceled/refunded
    if (payload.status === 'refused' || payload.event_type === 'PURCHASE_CANCELED' || payload.event_type === 'PURCHASE_REFUNDED') {
      const buyerEmail = payload.data?.buyer?.email

      if (buyerEmail) {
        // Mark loja as inactive
        await supabase
          .from('lojas')
          .update({
            ativo: false
          })
          .eq('login_usuario', buyerEmail)
      }

      return new Response(JSON.stringify({ success: true, message: 'Loja marked as inactive' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Unknown event
    return new Response(JSON.stringify({ success: true, message: 'Event received' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
