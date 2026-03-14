import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://untmxmbqgdagfqhmqyvm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudG14bWJxZ2RhZ2ZxaG1xeXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDQ1NjgsImV4cCI6MjA4ODU4MDU2OH0.i1ijydj0lRtDTa-dIMEJzMZVW9rDc5TnHwQ3Az2L70g'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createTestDriver() {
  try {
    console.log('1️⃣ Criando conta de motorista...')
    
    // Using signUp - requires email verification but we can mark as confirmed manually
    const { data, error } = await supabase.auth.signUp({
      email: 'motorista.teste@easydrive.com',
      password: 'Teste123!@#'
    })

    if (error) throw new Error(`Signup error: ${error.message}`)
    if (!data.user?.id) throw new Error('Usuário não criado')
    
    const userId = data.user.id
    console.log(`✅ Usuário criado (ID: ${userId.substring(0, 8)}...)`)
    console.log('⚠️  Email verification will be required on first login')
    
    // We'll add the subscription and profile records
    console.log('\n2️⃣ Criando assinatura vitalícia...')
    
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 100)
    
    // Insert subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: 'vitalicio',
        status: 'active',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })

    if (subError) {
      console.log('⚠️  Subscription insert error:', subError.message)
      console.log('   (This may fail if RLS policies require authentication)')
    } else {
      console.log('✅ Assinatura criada: VITALÍCIO')
    }
    
    console.log('\n3️⃣ Criando perfil de motorista...')
    
    // Insert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role: 'driver',
        display_name: 'Motorista Teste',
        active: true
      })

    if (profileError) {
      console.log('⚠️  Profile insert error:', profileError.message)
      console.log('   (This may fail if RLS policies require authentication)')
    } else {
      console.log('✅ Perfil criado: DRIVER')
    }
    
    console.log('\n✨ Conta de teste criada!')
    console.log('═══════════════════════════')
    console.log('📧 Email: motorista.teste@easydrive.com')
    console.log('🔐 Senha: Teste123!@#')
    console.log('👤 Tipo: Motorista')
    console.log('📅 Assinatura: Vitalício (infinito)')
    console.log('\n⚠️  Nota: Você pode precisar confirmar o email na primeira vez')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

createTestDriver()
