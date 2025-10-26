# Laboratório de Análises de Solo

Sistema web para gerenciamento de laboratório de análises de solo.

## Stack Tecnológica

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma

## Instalação

1. Instale todas as dependências:
```bash
npm run install:all
```

2. Configure o banco de dados PostgreSQL

3. Configure as variáveis de ambiente no arquivo `.env`

4. Execute as migrações do banco:
```bash
cd backend && npx prisma migrate dev
```

5. Inicie o projeto em modo desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

```
projeto/
├── frontend/          # Aplicação React
├── backend/           # API Node.js
├── database/          # Scripts SQL
└── shared/           # Tipos TypeScript compartilhados
```

## Funcionalidades

- ✅ Cadastro de clientes
- ✅ Cadastro de amostras
- ✅ Lançamento de resultados de análises
- ✅ Visualização de relatórios
- ✅ Interface responsiva
