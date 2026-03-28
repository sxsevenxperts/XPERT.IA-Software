# 🔐 Smart Market - Login & Senha por Loja

## Arquitetura de Autenticação

Cada loja tem **seu próprio login e senha**, gerenciado através de:

### 1. Supabase Auth (Camada de Autenticação)

```
Loja A ─┐
        ├─→ auth.usuarios  ← (Email único por usuário)
Loja B ─┤    └─ login_usuario = "gerente_lojaA@smartmarket.com"
        │       password_usuario = "hash_bcrypt"
Loja C ─┘       
```

**Tabela: auth.usuarios**
```sql
-- Supabase User (gerenciado pelo Supabase Auth)
┌─ id (UUID)
├─ email (único globalmente)
├─ email_confirmed_at
├─ encrypted_password
└─ created_at
```

### 2. Mapeamento Loja-Usuário (Nossa camada)

```sql
-- public.usuarios_lojas
┌─ usuario_id (FK → auth.users)
├─ loja_id (FK → lojas)
├─ role (gerente, estoquista, vendedor, administrador)
├─ login_usuario (email da loja)
├─ senha_usuario (hash, opcional - usar Supabase Auth)
└─ ativo (true/false)

UNIQUE(loja_id, usuario_id)  -- Um usuário por loja
UNIQUE(loja_id, email)       -- Email único por loja
```

---

## 🔓 Fluxo de Login

### Tela de Login - Opção 1: Por Email (Recomendado)

```
┌─────────────────────────────────┐
│  Smart Market Login             │
├─────────────────────────────────┤
│                                 │
│  Email: gerente@minhaloja.com  │
│  Senha: ••••••••••             │
│                                 │
│  [ Entrar ]                     │
│                                 │
│  Esqueceu a senha?              │
│                                 │
└─────────────────────────────────┘

✅ Usa Supabase Auth nativo
✅ One-click sign-in com link mágico
✅ 2FA opcional
✅ Recuperação de senha automática
```

### Tela de Login - Opção 2: Por Loja + Login

```
┌─────────────────────────────────┐
│  Smart Market Login             │
├─────────────────────────────────┤
│                                 │
│  Loja: [dropdown - Selecione]  │
│       ├─ Loja A                │
│       ├─ Loja B                │
│       └─ Loja C                │
│                                 │
│  Login: gerente                │
│  Senha: ••••••••••             │
│                                 │
│  [ Entrar ]                     │
│                                 │
└─────────────────────────────────┘

✅ Multi-loja na mesma tela
✅ Usa campos customizados (login_usuario, senha_usuario)
✅ Mais intuitivo para gerentes de múltiplas lojas
✅ Requer backend validation extra
```

---

## 🏪 Implementação: Opção Recomendada

### Opção A: Email (RECOMENDADO - Seguro + Simples)

```javascript
// src/pages/Login.jsx - Fluxo atual (mantém como está)
const handleLogin = async (email, password) => {
  // 1. Validar email + senha com Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })
  
  // 2. Se sucesso, buscar lojas do usuário
  if (data.user) {
    const { data: usuariosLojas } = await supabase
      .from('usuarios_lojas')
      .select('loja_id, lojas(nome, cnpj)')
      .eq('usuario_id', data.user.id)
      .eq('ativo', true)
    
    // 3. Se tem 1 loja: entra direto
    // 4. Se tem >1 loja: tela de seleção
    
    setAuth({ user: data.user, lojas: usuariosLojas })
  }
}
```

**Vantagens:**
- ✅ Segurança Supabase nativa (2FA, SAML, SSO)
- ✅ Sem guardar senhas em nossa base
- ✅ Recovery automático
- ✅ Email verification
- ✅ Testes com usuários pré-criados

**Database:**
```sql
-- Usuário Supabase cria:
INSERT INTO auth.users (email, encrypted_password, ...)

-- Nossa table mapeiam:
INSERT INTO usuarios_lojas (usuario_id, loja_id, role, ativo)
VALUES ('uuid-user', 'uuid-loja', 'gerente', true)
```

---

### Opção B: Login + Senha Customizado

```javascript
// Fluxo customizado
const handleLogin = async (lojaId, login, senha) => {
  // 1. Buscar usuário por loja + login
  const { data: usuario } = await supabase
    .from('usuarios_lojas')
    .select('usuario_id, senha_usuario')
    .eq('loja_id', lojaId)
    .eq('login_usuario', login)
    .single()
  
  // 2. Validar senha com bcrypt
  const senhaValida = await bcrypt.compare(senha, usuario.senha_usuario)
  
  if (senhaValida) {
    // 3. Criar sessão manual ou usar Supabase Auth
    setAuth({ loja_id: lojaId, usuario_id: usuario.usuario_id })
  }
}
```

**Vantagens:**
- ✅ Controle total do login
- ✅ Customização por loja
- ✅ Sem dependência Supabase Auth

**Desvantagens:**
- ❌ Gerenciar senhas é responsabilidade sua
- ❌ Sem 2FA nativo
- ❌ Sem SSO/SAML
- ❌ Recovery manual

---

## 📊 Comparação

| Aspecto | Email (A) | Login+Senha (B) |
|---------|-----------|-----------------|
| **Segurança** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **2FA/SAML** | ✅ Nativo | ❌ Manual |
| **Recovery** | ✅ Automático | ❌ Manual |
| **Customização** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Controle Loja** | ✅ Via usuários_lojas | ✅ Via login_usuario |
| **Complexidade** | Baixa | Alta |

---

## 💡 Implementação Recomendada (HÍBRIDA)

```javascript
// Melhor dos dois mundos
const handleLogin = async (email, password) => {
  // 1. Autenticar com Supabase Auth (seguro)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })
  
  if (!error && data.user) {
    // 2. Buscar lojas do usuário
    const { data: usuariosLojas } = await supabase
      .from('usuarios_lojas')
      .select(`
        loja_id, 
        role,
        lojas(id, nome, cnpj, city, estado)
      `)
      .eq('usuario_id', data.user.id)
      .eq('ativo', true)
    
    // 3. Se múltiplas lojas: tela de seleção
    if (usuariosLojas.length > 1) {
      return <SelectLoja lojas={usuariosLojas} />
    }
    
    // 4. Entrar na loja única ou selecionada
    const lojaAtiva = usuariosLojas[0]
    setAuth({ 
      user: data.user, 
      loja: lojaAtiva,
      role: lojaAtiva.role
    })
    
    setLoja(lojaAtiva.loja_id)  // RLS vai usar isso
  }
}
```

---

## 🔑 Schema final para Login por Loja

```sql
-- Tabela usuarios_lojas (EXISTENTE - manter como está)
CREATE TABLE usuarios_lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,  -- gerente, estoquista, vendedor, admin
  
  -- OPCIONAL: Se quiser login+senha customizado
  login_usuario VARCHAR(100),  -- ex: "gerente1"
  senha_usuario VARCHAR(255),  -- hash bcrypt, se não usar Supabase Auth
  
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(usuario_id, loja_id),
  UNIQUE(loja_id, login_usuario)  -- Se usar campo customizado
);

-- RLS Policy: Usuário vê só sua própria loja
CREATE POLICY "Usuário vê sua loja" ON usuarios_lojas
  FOR SELECT USING (usuario_id = auth.uid());
```

---

## 🚀 Próximos Passos

### Já Implementado
- ✅ usuarios_lojas table
- ✅ RLS por loja_id
- ✅ Supabase Auth integrado

### Adicionar (Opcional)
- [ ] Campo login_usuario em usuarios_lojas (se quiser customizar)
- [ ] Campo senha_usuario em usuarios_lojas (se não usar Supabase Auth)
- [ ] Tela de seleção de loja (se múltiplas lojas por user)
- [ ] Reset senha por loja
- [ ] 2FA por loja (Supabase MFA)

---

## 📋 Recomendação Final

**Use a Opção A (Email via Supabase Auth)** porque:
1. ✅ Segurança de nível empresarial
2. ✅ Zero responsabilidade de gerenciar senhas
3. ✅ 2FA, SAML, SSO, Recovery automáticos
4. ✅ Auditoria completa
5. ✅ Compatível com RLS por loja_id

**Cada loja terá:**
- Email único (ex: gerente@loja-a.smartmarket.com)
- Password seguro (gerenciado Supabase)
- Role específico (gerente, estoquista, etc)
- Acesso 100% isolado via RLS (loja_id)

🎯 **Resultado:** Cada loja = seu próprio email/senha + isolamento completo de dados
