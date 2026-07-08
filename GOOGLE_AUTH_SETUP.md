# 🔑 Configurar Login com Google

## 📋 Passo 1: Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em **Select a Project** → **New Project**
3. Nome: `PontoAPP` ou similar
4. Clique **Create**
5. Aguarde a criação (pode levar alguns segundos)

## 🔐 Passo 2: Criar Credenciais OAuth

1. No menu lateral, vá para **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **OAuth 2.0 Client ID**
3. Se solicitado, configure a **OAuth consent screen**:
   - User Type: **External**
   - Clique **Create**
   - Preencha:
     - App name: `PontoAPP`
     - User support email: seu email
     - Developer contact: seu email
   - Clique **Save and Continue** (skip scopes)
   - Clique **Save and Continue** (test users)
   - Clique **Back to Dashboard**

## 🌐 Passo 3: Configurar URIs de Redirecionamento

1. Volte para **Credentials**
2. Clique **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `PontoAPP Web`
5. Em **Authorized JavaScript origins**, adicione:
   ```
   http://localhost:5175
   http://localhost:3000
   https://lyunxbgqodhbqrvdqmqz.supabase.co
   ```
6. Em **Authorized redirect URIs**, adicione:
   ```
   http://localhost:5175/
   http://localhost:3000/
   https://lyunxbgqodhbqrvdqmqz.supabase.co/auth/v1/callback
   ```
7. Clique **Create**

## 📝 Passo 4: Copiar Client ID

1. Você verá uma janela com:
   - **Client ID** (copie este)
   - **Client Secret** (copie este também)
2. Guarde em um lugar seguro

## 🔗 Passo 5: Configurar no Supabase

1. Acesse: https://app.supabase.com
2. Selecione projeto **Apps** (lyunxbgqodhbqrvdqmqz)
3. Vá em **Authentication** → **Providers**
4. Procure por **Google** e clique para expandir
5. Cole:
   - **Client ID**: valor copiado do Google
   - **Client Secret**: valor copiado do Google
6. Clique **Save**

## ✅ Pronto!

Agora você pode fazer login com Google no PontoAPP!

### 🧪 Testar Localmente

1. Acesse http://localhost:5175
2. Clique **Login com Google**
3. Selecione sua conta Google
4. Pronto! ✨

## ⚠️ Notas Importantes

- **Em desenvolvimento**: Login redireciona para localhost:5175
- **Em produção**: Configure a URL do seu domínio
- **Client Secret**: Nunca exponha em código público
- **Segurança**: Sempre use HTTPS em produção

## 🚀 Para Deploy em Produção

Quando fizer deploy (ex: Vercel), adicione:
- URL do seu domínio em **Authorized JavaScript origins**
- `https://seudominio.com/` em **Authorized redirect URIs**

Após isso, atualize as credenciais no Supabase com a nova URL.
