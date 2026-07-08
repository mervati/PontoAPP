# PontoAPP - Setup Inicial

## Configuração do Supabase

### 1. Criar Tabelas no Supabase

Execute os seguintes SQL no seu projeto Supabase:

```sql
-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de registros de ponto
CREATE TABLE pontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada_trabalho', 'entrada_almoco', 'saida_almoco', 'saida_trabalho')),
  hora TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_pontos_user_id ON pontos(user_id);
CREATE INDEX idx_pontos_created_at ON pontos(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own pontos" ON pontos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pontos" ON pontos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pontos" ON pontos FOR UPDATE USING (auth.uid() = user_id);
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha com suas credenciais:

```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Você encontra essas informações em:
- Supabase Dashboard > Project Settings > API > URL e Keys

### 3. Instalar Dependências

```bash
npm install
```

### 4. Rodar Projeto

```bash
npm run dev
```

O app estará disponível em `http://localhost:5175`

## Funcionalidades

- ✅ Autenticação com Supabase
- ✅ Registro de 4 pontos diários (entrada trabalho, entrada almoço, saída almoço, saída trabalho)
- ✅ Cálculo automático de banco de horas
- ✅ Histórico de pontos
- ✅ Perfil do usuário
- ✅ PWA (funciona offline)
- ✅ Design responsivo dark mode

## Build para Produção

```bash
npm run build
```
