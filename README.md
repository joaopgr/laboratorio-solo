# Laboratório de Análises de Solo

Documentação completa para apresentação do Trabalho de Conclusão de Curso (TCC) e para orientar avaliadores, professores e interessados sobre a arquitetura, funcionalidades, decisões técnicas e processos do sistema.

---

## Visão Geral
- **Problema atendido**: Organizar o fluxo operacional de um laboratório de análises de solo, centralizando cadastro de clientes e amostras, registro de resultados, geração de laudos e relatórios gerenciais.
- **Proposta**: Plataforma web full-stack (frontend + backend + banco) com foco em produtividade da equipe de laboratório, rastreabilidade e geração automatizada de documentos oficiais.
- **Modelo de implantação**: API Node.js hospedada (ex.: Vercel) conectando-se a banco PostgreSQL (Supabase ou instância dedicada) e frontend React publicado como SPA.
- **Status atual**: MVP funcional em produção interna, com oportunidades de evolução (testes automatizados, melhorias de segurança e monitoramento).

---

## Objetivos do Projeto
- Digitalizar o processo de atendimento a produtores rurais e cooperativas.
- Reduzir erros manuais em cadastros e cálculos laboratoriais.
- Padronizar laudos técnicos com geração automática em PDF e HTML.
- Oferecer relatórios e dashboards que apoiem a tomada de decisão.
- Criar base tecnológica extensível para novas análises (foliar, granulometria etc.).

---

## Público-Alvo e Benefícios
- **Técnicos de laboratório**: registro rápido de lotes, amostras e resultados, com validação de regras.
- **Coordenadores/gestores**: visão consolidada de status de lotes, relatórios financeiros e produtividade.
- **Clientes finais**: laudos padronizados e fáceis de compreender.

Benefícios diretos: redução de retrabalho, rastreabilidade de dados, integração entre áreas administrativa e técnica, geração ágil de laudos e relatórios.

---

## Fluxos Principais do Sistema
1. **Autenticação** – Usuários acessam com e-mail/senha; tokens JWT controlam sessões seguras.
2. **Cadastro de clientes** – Informações de contato, propriedades e histórico de lotes.
3. **Gestão de lotes e amostras** – Cadastro manual ou em lote, com associação a tipos de análise (solo, foliar, granulometria).
4. **Resultados laboratoriais** – Inserção de medições, cálculos auxiliares e validações de consistência.
5. **Geração de relatórios e laudos** – Exportação em PDF/HTML usando templates consistentes e bibliotecas de renderização.
6. **Relatórios gerenciais** – Consulta de status, filtros avançados e dashboards (ex.: `Relatorios.tsx`).
7. **Auditoria e histórico** – Logs detalhados de operações críticas (criação/edição de registros).

---

## Estrutura do Projeto
```
lab/
├── backend/            # API REST Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/     # Rotas organizadas por domínio (cliente, lote, laudo...)
│   │   ├── database/   # Conexão e utilitários PostgreSQL
│   │   └── utils/      # Cálculos, geração de PDFs, logs
│   ├── public/         # Logos e assets usados nos laudos
│   └── api/            # Handler serverless (Vercel)
├── frontend/           # SPA em React + Vite + Tailwind CSS
│   ├── src/components/ # Componentes reutilizáveis (forms, modais, tabelas)
│   ├── src/pages/      # Páginas e rotas da aplicação (ex.: `Relatorios.tsx`)
│   ├── src/hooks/      # Hooks de integração (React Query, formulários)
│   ├── src/contexts/   # Contextos globais (auth, módulo ativo)
│   └── src/utils/      # Helpers (ex.: geração de PDF cliente-side)
├── shared/             # Tipos TypeScript compartilhados entre front/back
├── scripts SQL         # Migrações e correções de banco (`*.sql`)
└── docs auxiliares     # Guias de deploy, instruções de instalação
```

---

## Stack Tecnológica e Justificativas
### Frontend
- **React 18 + TypeScript** – Componentização, tipagem forte e comunidade consolidada; facilita reutilização e evita erros de integração.
- **Vite** – Ambiente de desenvolvimento rápido e bundle eficiente, reduzindo tempo de feedback durante o desenvolvimento.
- **Tailwind CSS** – Permite estilização consistente via classes utilitárias, acelerando prototipagem e mantendo design responsivo.
- **@tanstack/react-query** – Gerenciamento de estados assíncronos (fetch/cache) com invalidação automática; reduz código boilerplate para chamadas à API.
- **React Hook Form + Zod** – Formulários performáticos com validação consistente entre UI e backend; facilita exibição de mensagens ao usuário.
- **Axios** – Cliente HTTP robusto com interceptors e suporte a cancelamento.
- **html2canvas + jspdf + jspdf-autotable** – Geração de relatórios e laudos exportáveis diretamente do cliente para apresentações rápidas.
- **date-fns** – Manipulação de datas simples e imutável.
- **Lucide React** – Iconografia moderna com SVGs leves.

**Vantagens**: produtividade alta, tipagem end-to-end com `shared/`, experiência fluida para o usuário.  
**Desafios**: reque o setup inicial (React Query + formulários) e atenção a regras de cache/invalidations.

### Backend
- **Node.js + Express + TypeScript** – API REST simples, escalável e tipada; Express oferece controle fino sobre middlewares e rotas.
- **pg (node-postgres)** – Acesso direto ao PostgreSQL via pool de conexões; escolhido pela flexibilidade e performance em consultas complexas.
- **Zod** – Validação de payloads no backend, garantindo integridade entre camadas.
- **bcryptjs + jsonwebtoken** – Autenticação segura com hash de senhas e tokens JWT.
- **@sparticuz/chromium + puppeteer-core + html-pdf** – Geração de laudos PDF a partir de templates HTML com alta fidelidade visual.
- **dotenv** – Gestão de variáveis sensíveis (.env).
- **helmet (temporariamente desativado)** – Segurança HTTP; está documentado para reativação após resolver requisitos de CORS.

**Vantagens**: controle total sobre queries e cálculos específicos do domínio, facilidade para expandir rotas REST, independência de ORM.  
**Desafios**: necessidade de tratar SQL manualmente e garantir consistência com transações e validação de entradas.

### Banco de Dados e Infraestrutura
- **PostgreSQL** – Suporte a tipos avançados, confiabilidade e compatibilidade com Supabase (facilitando deploy gerenciado).
- **Scripts SQL versionados** – Arquivos `MIGRAR_*.sql`, `VERIFICAR_*.sql` documentam correções e migrações aplicadas ao longo do projeto.
- **Deploy** – Backend preparado para ambiente serverless (Vercel) via `backend/api/index.js`; frontend pode ser hospedado no Vercel ou outra CDN.
- **Logs e monitoramento** – Logs de queries (`console.log` controlado) e arquivos de auditoria para investigar inconsistências.

---

## Estratégias de Desenvolvimento
### Frontend
- Separação entre componentes de apresentação (`ModernCard`, `StatusBadge`) e containers mais complexos (`Relatorios`, `ClienteLotes`).
- Hooks customizados (`useLotes`, `useResultados`) encapsulam chamadas HTTP, invalidam cache e expõem estado de carregamento/erro.
- Contexto global de autenticação (`AuthContext`) controla sessão, perfil do usuário e rotas protegidas (`ProtectedRoute`).
- Formulários modulares reutilizam validações Zod, garantindo mensagens de erro coerentes e evitando submissões inválidas.
- Geração de relatórios client-side otimiza resposta ao usuário sem bloquear o backend.

### Backend
- Rotas organizadas por recurso (ex.: `routes/relatorio.ts`, `routes/laudo.ts`) com separação clara de responsabilidades.
- `database/queries.ts` centraliza instruções SQL; uso de `transaction()` garante atomicidade em operações críticas (cadastro de lote + amostras).
- Utilitários (`utils/calculosResultados.ts`, `utils/logging.ts`) isolam regras de negócio, facilitando manutenção e testes futuros.
- Middleware CORS manual garante compatibilidade com múltiplos domínios (local, produção).
- Tratamento centralizado de erros retorna mensagens amigáveis ao frontend e logs detalhados para investigação.

### Qualidade e Organização
- Tipos compartilhados (`shared/types/index.ts`) mantêm frontend e backend sincronizados.
- Scripts `.sql` e `.md` documentam histórico de ajustes (importante para responder perguntas sobre migrações durante o TCC).
- Processo de build separa responsabilidades: `npm run build:backend` gera `dist/` TypeScript compilado; `npm run build:frontend` usa Vite.

---

## Fluxos de Negócio em Destaque
### 1. Cadastro de Cliente → Lote → Amostras
1. Técnico logado acessa `Clientes` e cria um cliente (dados básicos, propriedades).
2. Abre o modal `AmostrasLoteForm` para cadastrar várias amostras de uma vez; campos globais (data, cidade, solicitante) são aplicados automaticamente.
3. O backend cria o lote e associa amostras, garantindo integridade via transação.
4. Hooks React invalidam caches e atualizam tabelas em tempo real.

### 2. Lançamento e Cálculo de Resultados
1. Usuário navega à página `Resultados` ou `Relatorios`.
2. Formulário valida medições (pH, nutrientes, granulometria) com regras específicas.
3. Backend aplica cálculos auxiliares (`calculosResultados.ts`) e persiste resultados.
4. Logs guardam histórico da alteração para auditoria.

### 3. Geração de Laudo e PDF
1. Usuário seleciona lote e aciona `GerarLaudoModal`.
2. Backend monta HTML com dados do lote, gráficos/tabelas e logotipos (`backend/public/logos`).
3. `puppeteer-core` renderiza HTML usando Chromium serverless e gera PDF.
4. Arquivo é enviado ao frontend para download, arquivado se necessário e registrado em `backend/laudos/` para referência.

### 4. Relatórios Gerenciais
1. Página `Relatorios.tsx` fornece filtros combinados (período, cliente, status, tipo de análise).
2. React Query consulta `/api/relatorios` com parâmetros dinâmicos.
3. Resultados alimentam tabelas e gráficos com indicadores (análises por status, tempo médio, pendências).
4. Exportação para Excel/PDF usa bibliotecas `xlsx` e `jspdf` no frontend.

---

## Segurança, Auditoria e Boas Práticas
- Hash de senhas com `bcryptjs`; tokens JWT curtos reduzem risco de sequestro de sessão.
- Cabeçalhos CORS controlados; `helmet` previsto para reforçar segurança em produção.
- Logs detalham usuário, operação e timestamp (importante para explicar rastreabilidade no TCC).
- Separação de ambientes via variáveis (`NODE_ENV`, `DATABASE_URL`, `FRONTEND_URL`).
- Pastas sensíveis (`laudos/`, backups) fora do controle de versão público.
- Recomendações futuras: rate limiting, monitoramento (Logtail, Datadog), testes de carga e auditoria LGPD (armazenar consentimento, anonimização).

---

## Qualidade, Testes e Garantia
- **Testes manuais**: checklists para rotas críticas (auth, criação de lote, geração de laudo). Útil mencionar em banca que cada release passa por roteiro pré-definido.
- **Logs de inconsistência**: arquivos como `backup_error.log`, `VERIFICAR_*.sql` documentam análises corretivas realizadas.
- **Planos futuros**:
  - Testes automatizados de API (Jest + Supertest) para endpoints sensíveis.
  - Integração com ferramentas de QA (Playwright) para fluxos completos no frontend.
  - Pipelines CI/CD (GitHub Actions) com lint, testes e deploy automatizado.

---

## Perguntas Frequentes para o TCC
- **Por que React + TypeScript?** – Garantir reatividade eficiente, comunidade forte e redução de bugs via tipagem estática.
- **Por que PostgreSQL em vez de MySQL?** – Melhor suporte a tipos avançados, extensões geográficas e compatibilidade com Supabase.
- **Como garantir consistência entre frontend e backend?** – Uso de `shared/types` + Zod sincroniza contratos e evita divergências.
- **Como o sistema escala?** – API stateless (JWT) pode rodar em múltiplas instâncias; PostgreSQL pode ser migrado para RDS/Azure; frontend é SPA distribuída via CDN.
- **Quais são os principais riscos?** – Falta de testes automatizados, dependência de geração de PDF via Chromium (precisa de configuração em ambiente serverless), necessidade de políticas de backup e segurança reforçadas.
- **Como tratar LGPD?** – Dados sensíveis cifrados em trânsito (HTTPS), acesso restrito por autenticação, logs para rastrear alterações; próximos passos incluem políticas de retenção de dados e consentimento explícito.
- **Quais métricas você monitora?** – Tempo médio de processamento de laudo, volume de lotes por semana, taxa de pendências; logs ajudam a medir performance de queries.
- **Se o banco cair, o que acontece?** – API retorna erro controlado; há scripts de backup (`backup-banco*.bat`, `backups/`) e documentação de restauração.

---

## Roteiro Sugerido para Apresentação
1. **Introdução (1 min)** – Contexto do laboratório e dores atuais.
2. **Objetivos e Público (1 min)** – O que o sistema resolve, quem utiliza.
3. **Arquitetura (2 min)** – Mostrar diagrama simples (frontend ↔ backend ↔ PostgreSQL) e explicar monorepo.
4. **Demonstração Rápida (4 min)** – Fluxo real: login → cadastro de cliente → criação de lote → lançamento de resultado → geração de laudo → relatório.
5. **Tecnologias e Decisões (3 min)** – Tabela com escolhas, motivos e trade-offs.
6. **Segurança e Qualidade (1 min)** – Autenticação, logs, planos de testes.
7. **Resultados e Próximos Passos (1 min)** – Benefícios alcançados, melhorias futuras (CI/CD, dashboards avançados).
8. **Perguntas** – Deixar diagramas de arquitetura e tabela de tecnologias visíveis.

Sugestão: ter slides com capturas reais das telas (`Relatorios`, `GerarLaudoModal`, `Logs`). Mostrar snippet de código-chave (ex.: validação Zod ou geração de PDF) para evidenciar domínio técnico.

---

## Roadmap Futuro
- Automação de testes E2E e monitoração contínua.
- Refinamento de UX (wizard para lotes complexos, notificações em tempo real).
- Integração com sistemas financeiros (faturamento).
- Multi-tenant (suporte a múltiplos laboratórios).
- Dashboard avançado com gráficos em tempo real.

---

## Guia de Execução Local
### Pré-requisitos
- Node.js >= 18
- PostgreSQL (local ou Supabase)
- Git

### Passos
1. **Instalar dependências** (raiz, backend e frontend):
```bash
   npm run install:all
   ```
2. **Configurar variáveis de ambiente**:
   - Copiar `backend/env.example` para `backend/.env` e ajustar `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`.
   - Configurar `frontend/.env` (se necessário) com `VITE_API_URL` apontando para o backend.
3. **Preparar banco**:
   - Executar scripts SQL iniciais (`CRIAR_USUARIOS.sql`, `MIGRAR_ATIVIDADES_COMPLETO.sql`, etc.) conforme documentação interna.
4. **Rodar em desenvolvimento**:
```bash
npm run dev
```
   - Backend disponível em `http://localhost:3001`
   - Frontend em `http://localhost:5173`
5. **Build para produção**:
   ```bash
   npm run build
   ```
   - Gera `backend/dist` (TypeScript compilado) e `frontend/dist` (bundle estático).
6. **Start em produção local**:
   ```bash
   cd backend && npm run start
   ```

### Deploy
- **Backend**: enviar `backend/api/index.js` + `dist/` para Vercel (serverless). Configurar variáveis no painel.
- **Frontend**: publicar `frontend/dist` em Vercel/Netlify/Static hosting.
- **Banco**: utilizar Supabase ou instância gerenciada; manter backups com scripts `.bat` disponíveis.

---

## Material de Apoio
- Pastas `docs/` e arquivos `README_DEPLOY.md`, `DEPLOY_VERCEL.md`, `INSTRUCOES.md` registram passo a passo de execução e decisões históricas.
- Logs (`backup_error.log`, `teste_conexao.log`) e scripts (`VERIFICAR_*.sql`) evidenciam processos de manutenção – úteis para demonstrar maturidade operacional na apresentação.
- Arquivos `.sql` exibem domínio sobre modelagem relacional e controle de versão manual do banco.

---

## Considerações Finais
Este README serve como roteiro para o TCC: explica o problema, a solução proposta, as decisões técnicas e os próximos passos do projeto. Use-o como base para montar slides, responder perguntas técnicas e demonstrar domínio sobre cada camada do sistema.
