# Laboratório de Análises de Solo

Sistema web para gerenciar o ciclo completo de análises laboratoriais de solo: cadastro de clientes, controle de lotes, registro de amostras, lançamento de resultados e geração de laudos.

---

## Visão Geral
- **Objetivo**: digitalizar o fluxo operacional do laboratório, reduzindo retrabalho e garantindo rastreabilidade dos dados.
- **Stack**: monorepo com backend Node.js + Express + TypeScript, frontend React + Vite + Tailwind CSS e banco PostgreSQL.
- **Implantação**: API hospedada em ambiente serverless (ex.: Vercel) com acesso ao PostgreSQL gerenciado; frontend distribuído como SPA.
- **Status**: aplicação em produção interna, com roadmap ativo para evoluções.

---

## Funcionalidades Principais
1. **Autenticação** — usuários administrativos acessam com e-mail e senha; clientes podem consultar laudos com CPF.
2. **Clientes e lotes** — cadastro, edição e histórico completo de lotes, incluindo marcação de pagamento e tipos de análise.
3. **Amostras e resultados** — inserção de dados laboratoriais, cálculos automáticos dos parâmetros derivados e auditoria de operações.
4. **Laudos** — geração em PDF/HTML usando templates padronizados e logotipos oficiais.
5. **Relatórios** — dashboards e filtros avançados para acompanhar pendências, produtividade e status financeiros.
6. **Logs e atividades** — rastreamento de ações críticas (criação/edição/exclusão) com data, usuário e detalhes.

---

## Estrutura do Repositório
```
lab/
├── backend/            # API REST Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/     # Rotas por domínio (cliente, lote, laudo, portal do cliente)
│   │   ├── database/   # Conexão e consultas PostgreSQL
│   │   └── utils/      # Cálculos, PDF, logging
│   ├── public/         # Assets usados nos laudos
│   └── api/            # Handler serverless (Vercel)
├── frontend/           # SPA em React + Vite + Tailwind
│   ├── src/components/ # Componentes reutilizáveis
│   ├── src/pages/      # Páginas públicas e administrativas
│   ├── src/hooks/      # Hooks com React Query, formulários etc.
│   └── src/contexts/   # Autenticação e módulo ativo
├── shared/             # Tipos TypeScript compartilhados front/back
└── scripts/SQL         # Scripts de manutenção e correções de banco
```

---

## Tecnologias e Decisões
### Frontend
- React 18 + TypeScript
- Vite para desenvolvimento e build
- Tailwind CSS para estilização rápida e consistente
- React Query para cache de requisições e sincronização com a API
- React Hook Form + Zod para validação
- axios, html2canvas, jspdf/jspdf-autotable, date-fns, lucide-react

### Backend
- Node.js + Express + TypeScript
- node-postgres (`pg`) para acesso direto ao banco
- Zod para validar payloads
- bcryptjs + jsonwebtoken para autenticação
- puppeteer-core + @sparticuz/chromium + html-pdf para laudos em PDF
- dotenv, helmet (reconfigurável), middlewares de CORS e tratamento de erros

### Infraestrutura
- PostgreSQL (Supabase ou instância dedicada)
- Deploy automatizado via Vercel (backend serverless + frontend estático)
- Scripts SQL versionados para correções e migrações
- Logs de aplicação e auditoria persistidos no banco

---

## Fluxos de Negócio
### Cadastro completo (cliente → lote → amostras)
1. Operador cadastra cliente
2. Registro de lote com tipo de análise e status financeiro
3. Inclusão de amostras, herdando dados globais e regras por módulo

### Resultados laboratoriais
1. Inserção dos dados brutos
2. Backend normaliza e calcula indicadores (SB, CTC, V, etc.)
3. Histórico e auditoria guardam alterações para rastreabilidade

### Geração de laudos
1. Usuário seleciona lote pł pago
2. Backend monta HTML com dados do cliente, amostras e resultados
3. PDF/HTML disponibilizado para download e arquivado

### Relatórios gerenciais
- Filtros por status, período, cliente, tipo de análise
- Exportação em Excel/PDF via bibliotecas client-side
- Indicadores para acompanhar pendências, volumes e prazos

---

## Segurança e Boas Práticas
- Senhas armazenadas com hash (bcrypt)
- Tokens JWT com expiração de 24h
- Mapeamento de papéis (`admin`, `analista`, `visualizador`, `cliente`)
- Rotas protegidas por middleware de permissão
- Logs centralizados com timestamp, usuário e detalhes da ação
- Recomendações futuras: rate limiting, monitoramento contínuo e cobertura de testes automatizados

---

## Roadmap Resumido
- Testes automatizados (API e E2E)
- Monitoramento e alertas de performance
- Integração financeira (faturamento)
- Multi-tenant (vários laboratórios)
- Dashboards em tempo real

---

## Guia Rápido de Desenvolvimento
### Pré-requisitos
- Node.js ≥ 18
- PostgreSQL
- Git

### Setup
```bash
npm run install:all        # instala dependências raiz, backend e frontend
cp backend/env.example backend/.env
# ajustar DATABASE_URL, JWT_SECRET, FRONTEND_URL

npm run dev                 # backend + frontend em modo desenvolvimento
# backend: http://localhost:3001
# frontend: http://localhost:3000 (proxy para /api → 3001)

npm run build               # build completo
cd backend && npm run start # start em modo produção local
```

### Deploy
- Backend: enviar `backend/dist` + `backend/api/index.js` para Vercel e configurar variáveis (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`)
- Frontend: publicar `frontend/dist` no Vercel (ou outro hosting estático)
- Banco: monitoramento, backups e scripts SQL versionados garantem consistência

---

## Apoio e Documentação Adicional
- Pasta `docs/` e scripts `.sql` registram decisões, ajustes e manutenções
- Logs (`backup_error.log`, `teste_conexao.log`) arquivados para auditoria
- Scripts `backup-banco*.bat` e `backups/` documentam rotinas de salvaguarda

---

## Licença
Todo o material é distribuído sob a licença especificada no `package.json`. Ajuste conforme necessário antes de publicação pública.
