# 🚀 Instruções de Instalação - Sistema LAB

## 📋 **Requisitos Mínimos**

### 1. **Node.js**
- **Versão**: 18.x ou superior
- **Download**: https://nodejs.org/
- **Verificação**: Abra o terminal e digite `node --version`

### 2. **PostgreSQL**
- **Opção 1**: PostgreSQL completo - https://www.postgresql.org/download/
- **Opção 2**: pgAdmin 4 (recomendado) - https://www.pgadmin.org/download/
- **Verificação**: Abra o terminal e digite `psql --version`

### 3. **Git** (opcional, para clonar repositório)
- **Download**: https://git-scm.com/

## 🛠️ **Instalação Automática**

### **Método 1: Script Automático (Recomendado)**

1. **Execute o script de setup:**
   ```bash
   setup-sistema.bat
   ```

2. **Configure o banco de dados:**
   - Crie um banco PostgreSQL chamado `lab_sistema`
   - Configure o arquivo `.env` no backend com suas credenciais

3. **Inicie o sistema:**
   ```bash
   start-sistema.bat
   ```

### **Método 2: Instalação Manual**

1. **Instalar dependências:**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configurar banco de dados:**
   - Crie um banco PostgreSQL chamado `lab_sistema`
   - Copie `backend/env.example` para `backend/.env`
   - Configure as credenciais no arquivo `.env`

3. **Executar migrações:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

4. **Iniciar o sistema:**
   ```bash
   start-sistema.bat
   ```

## ⚙️ **Configuração do Banco de Dados**

### **Arquivo `.env` (backend/.env):**
```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/lab_sistema"

# JWT
JWT_SECRET="seu_jwt_secret_aqui"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"
```

### **Criando o banco no PostgreSQL:**

**Via pgAdmin 4:**
1. Abra o pgAdmin 4
2. Conecte ao servidor PostgreSQL
3. Clique com botão direito em "Databases"
4. Selecione "Create" → "Database"
5. Nome: `lab_sistema`
6. Clique em "Save"

**Via linha de comando:**
```sql
CREATE DATABASE lab_sistema;
```

## 🚀 **Iniciando o Sistema**

### **Script Automático:**
```bash
start-sistema.bat
```

### **Manual:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 🌐 **Acessando o Sistema**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🔧 **Comandos Úteis**

### **Resetar banco de dados:**
```bash
cd backend
npx prisma migrate reset
```

### **Ver status das migrações:**
```bash
cd backend
npx prisma migrate status
```

### **Regenerar Prisma Client:**
```bash
cd backend
npx prisma generate
```

## ❗ **Problemas Comuns**

### **Erro: "Database not found"**
- Verifique se o banco `lab_sistema` foi criado
- Confirme as credenciais no arquivo `.env`

### **Erro: "Port already in use"**
- Pare outros serviços nas portas 3000 e 3001
- Ou altere as portas no arquivo `.env`

### **Erro: "Module not found"**
- Execute `npm install` em todas as pastas
- Verifique se o Node.js está na versão 18+

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique se todos os requisitos estão instalados
2. Confirme a configuração do banco de dados
3. Execute os comandos de diagnóstico:
   - `node --version`
   - `psql --version`
   - `npm --version`

## 🎯 **Checklist de Instalação**

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL instalado
- [ ] Banco `lab_sistema` criado
- [ ] Arquivo `.env` configurado
- [ ] Dependências instaladas
- [ ] Migrações executadas
- [ ] Sistema iniciado
- [ ] Acesso via http://localhost:3000 funcionando



