#!/usr/bin/env python3
"""
Reordena o V3 para seguir EXATAMENTE a ordem descrita:
1. Responde (LLM com knowledge + web)
2. Se qualificado → relatório (número ou grupo)
3. Objeção → plano → envia (número ou grupo)
4. Transfere para atendente
"""
import json

with open("workflow-agente-sdr-v3.json", encoding="utf-8") as f:
    v3 = json.load(f)

# ──────────────────────────────────────────────────────────────────────────────
# NOVA ORDEM DE CONEXÕES — completa
# ──────────────────────────────────────────────────────────────────────────────
def conn(target):
    return {"node": target, "type": "main", "index": 0}

connections = {

    # ── 1. ENTRADA ────────────────────────────────────────────────────────────
    "Webhook - Evolution API": {"main": [
        [conn("Normaliza e filtra mensagem")]
    ]},
    "Normaliza e filtra mensagem": {"main": [
        [conn("Resolve cliente pelo instanceName")]
    ]},
    "Resolve cliente pelo instanceName": {"main": [
        [conn("Registra novo contato")]
    ]},
    "Registra novo contato": {"main": [
        [conn("Verifica saldo de tokens")]
    ]},
    "Verifica saldo de tokens": {"main": [
        [conn("Bloqueado por tokens?")]
    ]},
    "Bloqueado por tokens?": {"main": [
        [conn("E audio?")],               # FALSE = tem saldo → continua
        [conn("Envia aviso: sem tokens")] # TRUE  = sem saldo → avisa e encerra
    ]},

    # ── 2. TRATAMENTO DE MÍDIA ────────────────────────────────────────────────
    "E audio?": {"main": [
        [conn("Download audio")],   # TRUE  = é áudio
        [conn("E imagem?")]         # FALSE = não é áudio
    ]},
    "Download audio": {"main": [
        [conn("Transcreve audio (Whisper)")]
    ]},
    "Transcreve audio (Whisper)": {"main": [
        [conn("Merge: audio -> texto")]
    ]},
    "Merge: audio -> texto": {"main": [
        [conn("Prepara contexto final")]
    ]},
    "E imagem?": {"main": [
        [conn("Descreve imagem (Vision)")],  # TRUE
        [conn("E documento?")]               # FALSE
    ]},
    "Descreve imagem (Vision)": {"main": [
        [conn("Prepara contexto final")]
    ]},
    "E documento?": {"main": [
        [conn("Extrai texto documento")],    # TRUE
        [conn("Prepara contexto final")]     # FALSE = texto puro
    ]},
    "Extrai texto documento": {"main": [
        [conn("Prepara contexto final")]
    ]},

    # ── 3. CONFIG + HISTÓRICO + KNOWLEDGE BASE ────────────────────────────────
    "Prepara contexto final": {"main": [
        [conn("Busca todas configs (agente_config)")]
    ]},
    "Busca todas configs (agente_config)": {"main": [
        [conn("Busca historico da conversa")]
    ]},
    "Busca historico da conversa": {"main": [
        [conn("Salva mensagem do cliente")]
    ]},
    # Salva msg → DIRETO para knowledge base (sem transfer aqui)
    "Salva mensagem do cliente": {"main": [
        [conn("Busca base de conhecimento")]
    ]},
    "Busca base de conhecimento": {"main": [
        [conn("Monta system prompt")]
    ]},

    # ── 4. SILÊNCIO ESTRATÉGICO ───────────────────────────────────────────────
    "Monta system prompt": {"main": [
        [conn("Calcula silencio estrategico")]
    ]},
    "Calcula silencio estrategico": {"main": [
        [conn("Silencio estrategico?")]
    ]},
    "Silencio estrategico?": {"main": [
        [conn("Aguarda 10s (silencio)")],    # TRUE  = deve esperar
        [conn("Chama LLM via llm-proxy")]    # FALSE = pode responder
    ]},
    "Aguarda 10s (silencio)": {"main": [
        [conn("Chama LLM via llm-proxy")]
    ]},

    # ── 5. LLM + TOKENS + HISTÓRICO ──────────────────────────────────────────
    "Chama LLM via llm-proxy": {"main": [
        [conn("Extrai tokens usados")]
    ]},
    "Extrai tokens usados": {"main": [
        [conn("Desconta tokens")]
    ]},
    "Desconta tokens": {"main": [
        [conn("Salva resposta da IA")]
    ]},

    # ── 6. ENVIO DA RESPOSTA (1ª ação após LLM) ───────────────────────────────
    "Salva resposta da IA": {"main": [
        [conn("Responder em audio?")]   # Responde PRIMEIRO, depois qualifica
    ]},
    "Responder em audio?": {"main": [
        [conn("Gera audio TTS")],       # TRUE  = resposta em áudio
        [conn("Envia texto ao lead")]   # FALSE = resposta em texto
    ]},
    "Gera audio TTS": {"main": [
        [conn("Prepara audio para envio")]
    ]},
    "Prepara audio para envio": {"main": [
        [conn("Envia audio ao lead")]
    ]},
    # Ambos os canais de resposta convergem para qualificação
    "Envia audio ao lead": {"main": [
        [conn("Analisa qualificacao do lead")]
    ]},
    "Envia texto ao lead": {"main": [
        [conn("Analisa qualificacao do lead")]
    ]},

    # ── 7. QUALIFICAÇÃO + RELATÓRIO (2ª ação) ─────────────────────────────────
    "Analisa qualificacao do lead": {"main": [
        [conn("Atualiza lead (Supabase)")]
    ]},
    "Atualiza lead (Supabase)": {"main": [
        [conn("Lead qualificado?")]
    ]},
    "Lead qualificado?": {"main": [
        [conn("Busca config: destino relatorio")],   # TRUE  = qualificado → relatório
        [conn("Detecta objecao")]                    # FALSE = não qualificado → objeção
    ]},
    "Busca config: destino relatorio": {"main": [
        [conn("Formata relatorio de qualificacao")]
    ]},
    "Formata relatorio de qualificacao": {"main": [
        [conn("Enviar para numero ou grupo?")]
    ]},
    "Enviar para numero ou grupo?": {"main": [
        [conn("Envia relatorio ao numero")],   # TRUE  = tem número destino
        [conn("Envia relatorio ao grupo")]     # FALSE = só grupo
    ]},
    # Após enviar relatório → continua para detecção de objeção
    "Envia relatorio ao numero": {"main": [
        [conn("Detecta objecao")]
    ]},
    "Envia relatorio ao grupo": {"main": [
        [conn("Detecta objecao")]
    ]},

    # ── 8. OBJEÇÃO → PLANO (3ª ação) ─────────────────────────────────────────
    "Detecta objecao": {"main": [
        [conn("Tem objecao?")]
    ]},
    "Tem objecao?": {"main": [
        [conn("Gera plano de acao")],                 # TRUE  = detectou objeção
        [conn("Detecta pedido de transferencia")]     # FALSE = sem objeção → transfer
    ]},
    "Gera plano de acao": {"main": [
        [conn("Salva objecao")]
    ]},
    "Salva objecao": {"main": [
        [conn("Envia plano ao agente")]
    ]},
    # Após enviar plano → continua para transfer
    "Envia plano ao agente": {"main": [
        [conn("Detecta pedido de transferencia")]
    ]},

    # ── 9. TRANSFERÊNCIA PARA ATENDENTE (4ª ação) ────────────────────────────
    "Detecta pedido de transferencia": {"main": [
        [conn("Quer atendente humano?")]
    ]},
    "Quer atendente humano?": {"main": [
        [conn("Avisa lead: transferindo")],    # TRUE  = quer atendente
        [conn("Responde 200 OK")]              # FALSE = sem transfer → encerra
    ]},
    "Avisa lead: transferindo": {"main": [
        [conn("Monta notificacao de transferencia")]
    ]},
    "Monta notificacao de transferencia": {"main": [
        [conn("Notifica atendente")]
    ]},
    # Notifica atendente → encerra (sem próximo nó)
}

# Atualiza e salva
v3["connections"] = connections

with open("workflow-agente-sdr-v3.json", "w", encoding="utf-8") as f:
    json.dump(v3, f, ensure_ascii=False, indent=2)

with open("workflow-agente-sdr-v3.json") as f:
    final = json.load(f)

print(f"✅ V3 reordenado com {len(final['nodes'])} nos")
print(f"   Conexoes: {len(final['connections'])} nodes com saidas")
print()
print("📋 FLUXO NA ORDEM CORRETA:")
print("   1️⃣  Mensagem → tokens → midia → config → knowledge base")
print("   2️⃣  Monta prompt → silencio → LLM (com web search)")
print("   3️⃣  ENVIA RESPOSTA (texto ou audio)")
print("   4️⃣  Qualifica lead → SE QUALIFICADO → RELATORIO (numero/grupo)")
print("   5️⃣  DETECTA OBJECAO → plano → envia ao agente")
print("   6️⃣  DETECTA TRANSFERENCIA → avisa lead → notifica atendente")
