#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const SUPABASE_URL = 'https://kyefzktzhviahsodyayd.supabase.co'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function main() {
  console.log('\n📝 Criador de Usuário Admin - EasyDrive')
  console.log('=====================================\n')

  // Get service role key
  const serviceRoleKey = await prompt(
    '🔑 Cole a SUPABASE_SERVICE_ROLE_KEY (obtém em Settings > API > Service Role Key): '
  )

  if (!serviceRoleKey || serviceRoleKey.trim().length === 0) {
    console.error('❌ Erro: Service Role Key é obrigatória')
    rl.close()
    process.exit(1)
  }

  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, serviceRoleKey)

  try {
    console.log('\n⏳ Criando usuário admin...')

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'sevenxpertssxacademy@gmail.com',
      password: 'JAcyara.10davimaria',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'admin',
        name: 'Admin SevenXperts'
      }
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário auth:', authError.message)
      rl.close()
      process.exit(1)
    }

    console.log('✅ Usuário auth criado:', authData.user.id)

    const userId = authData.user.id

    // Create profile
    console.log('⏳ Criando perfil do usuário...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          name: 'Admin SevenXperts',
          escritorio: 'SevenXperts',
          oab: 'ADM/SP 00000'
        }
      ])

    if (profileError) {
      console.error('⚠️  Aviso ao criar perfil:', profileError.message)
    } else {
      console.log('✅ Perfil criado')
    }

    // Create subscription
    console.log('⏳ Criando subscrição...')
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 10) // 10 anos de subscrição

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert([
        {
          user_id: userId,
          plan: 'admin',
          status: 'active',
          expires_at: expiresAt.toISOString()
        }
      ])

    if (subscriptionError) {
      console.error('⚠️  Aviso ao criar subscrição:', subscriptionError.message)
    } else {
      console.log('✅ Subscrição criada (válida até 2036)')
    }

    console.log('\n✨ Admin criado com sucesso!')
    console.log('================================')
    console.log('Email: sevenxpertssxacademy@gmail.com')
    console.log('Senha: JAcyara.10davimaria')
    console.log('ID: ' + userId)
    console.log('\nAgora você pode fazer login no app! 🚀')

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
