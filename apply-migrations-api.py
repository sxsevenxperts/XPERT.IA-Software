#!/usr/bin/env python3
"""
PrevOS - Aplicador de Migrations via Supabase REST API
Requer: SUPABASE_SERVICE_KEY em variável de ambiente
"""

import os
import sys
import json
from pathlib import Path

# Verificar se tem a biblioteca requests
try:
    import requests
except ImportError:
    print("❌ Erro: requests não instalado")
    print("   Execute: pip install requests")
    sys.exit(1)

# Supabase credentials
PROJECT_ID = "kyefzktzhviahsodyayd"
SUPABASE_URL = f"https://{PROJECT_ID}.supabase.co"
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SERVICE_KEY:
    print("\n❌ SUPABASE_SERVICE_KEY não encontrada!\n")
    print("Para aplicar migrations via API, você precisa:")
    print("\n1. Obter sua Service Role Key:")
    print("   → Supabase Dashboard → Settings → API")
    print("   → Copiar 'service_role key'")
    print("\n2. Exportar a variável:")
    print('   export SUPABASE_SERVICE_KEY="seu_key_aqui"')
    print("\n3. Executar este script:")
    print("   python3 apply-migrations-api.py")
    print("\n" + "="*70)
    print("\n💡 Alternativa (sem código):")
    print("   Abra: https://app.supabase.com/project/kyefzktzhviahsodyayd/sql/new")
    print("   E copie/cole as migrations manualmente (2 minutos)")
    sys.exit(1)

def apply_migration(file_path):
    """Aplicar uma migration via API"""
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql = f.read()
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {file_path}")
        return False
    
    # API endpoint para executar SQL
    url = f"{SUPABASE_URL}/rest/v1/rpc/execute_sql"
    
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY
    }
    
    payload = {
        "query": sql
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            print(f"✅ {Path(file_path).name}")
            return True
        else:
            print(f"❌ {Path(file_path).name}")
            print(f"   Status: {response.status_code}")
            print(f"   Erro: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ {Path(file_path).name}")
        print(f"   Erro: {str(e)}")
        return False

def main():
    print("\n🚀 PrevOS - Aplicador de Migrations")
    print("="*70)
    
    migrations_dir = Path("supabase/migrations")
    migration_files = [
        "003_notification_system.sql",
        "004_calendar_integrations.sql",
        "005_case_predictions.sql",
        "006_portal_integrations.sql",
        "007_analytics_predictions.sql"
    ]
    
    print(f"\n📁 Aplicando migrations de: {migrations_dir}\n")
    
    success_count = 0
    for migration in migration_files:
        file_path = migrations_dir / migration
        if apply_migration(file_path):
            success_count += 1
    
    print(f"\n{'='*70}")
    print(f"\n📊 Resultado: {success_count}/{len(migration_files)} migrations aplicadas\n")
    
    if success_count == len(migration_files):
        print("✅ Todas as migrations foram aplicadas com sucesso!")
        print("\n🎯 Próximos passos:")
        print("   1. Abra: https://prevos.easypanel.io")
        print("   2. Faça login com: teste@prevos.com / 123456")
        print("   3. Verifique se as novas funcionalidades aparecem\n")
    else:
        print(f"⚠️  {len(migration_files) - success_count} migrations falharam")
        print("   Revise os erros acima\n")

if __name__ == "__main__":
    main()
