import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://untmxmbqgdagfqhmqyvm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudG14bWJxZ2RhZ2ZxaG1xeXZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMDQzOTA4MCwiZXhwIjoxODY4MjE1MDgwfQ.RKa3T_DqXvmTU2A0RCmWzY1-r6rEZhxM-Ky8N3XzLmA'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createTestDriver() {
  try {
    console.log('1️⃣ Criando usuário no Auth...')
    
    // Create user via admin API
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'motorista.teste@easydrive.com',
      password: 'Teste123!@#',
      email_confirm: true
    })

    if (userError) throw new Error(`Auth error: ${userError.message}`)
    if (!userData.user?.id) throw new Error('Usuário não criado')
    
    const userId = userData.user.id
    console.log(`✅ Usuário criado: ${userId}`)
    
    console.log('2️⃣ Criando assinatura vitalícia...')
    
    // Create lifetime subscription
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 100)
    
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: 'vitalicio',
        status: 'active',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })

    if (subError) throw new Error(`Subscription error: ${subError.message}`)
    console.log('✅ Assinatura criada: VITALÍCIO')
    
    console.log('3️⃣ Criando perfil de motorista...')
    
    // Create driver profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role: 'driver',
        display_name: 'Motorista Teste',
        active: true
      })

    if (profileError) throw new Error(`Profile error: ${profileError.message}`)
    console.log('✅ Perfil criado: DRIVER')
    
    console.log('\n✨ Conta de teste criada com sucesso!')
    console.log('📧 Email: motorista.teste@easydrive.com')
    console.log('🔐 Senha: Teste123!@#')
    console.log('👤 Tipo: Motorista')
    console.log('📅 Assinatura: Vitalício (infinito)')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

createTestDriver()
