# RecuperaPix — VSL Landing Page

## Original Problem Statement
Crie uma landing page VSL extremamente profissional, moderna, persuasiva e otimizada para conversão para a empresa RecuperaPix, focada em recuperação de valores perdidos em golpes, fraudes online e transações PIX indevidas. Visual premium dark mode, verde neon (#00FF66), preto fosco. Player de vídeo central com bloqueio de CTA até 60% assistido. Frontend-only (HTML5 + Tailwind + JS).

## User Choices
- Vídeo: arquivo local `vsl.mp4` (usuário adiciona depois) em `/app/frontend/public/vsl.mp4`
- URL CTA: `#` (placeholder)
- Sem backend
- Depoimentos fictícios criados (3 personas brasileiras)
- Logo: https://customer-assets.emergentagent.com/job_df9bb8fb-3e32-4ff7-aaf3-f036372a9b66/artifacts/2j3oavsg_logotipo.png

## Architecture
- **Stack**: React 19 + CRA + Tailwind 3 + shadcn/ui (Accordion). Sem backend.
- **Rota única**: `/` → `Landing.jsx`
- **Fontes**: Outfit (headings) + Inter (body) via Google Fonts
- **Cores**: bg `#050A08`, surface `#0C1410`, primary neon `#00FF66`

## Implementation Status (P0 ✅ done)
**Implementado em 12/12/2025:**
- ✅ Header sticky com logo + barra de prova social (+47 mil)
- ✅ Hero centralizada: overline neon, H1 "Recupere o dinheiro perdido em golpes online antes que seja tarde.", subtítulo, 3 bullets de credibilidade
- ✅ **VSL Player** (`VSLPlayer.jsx`):
  - HTML5 `<video>` com source `/vsl.mp4`
  - Tracking real de `maxWatched` (não currentTime)
  - **Anti-seek**: se usuário arrasta timeline além de `maxWatched + 1s`, volta para `maxWatched` (testado e funcionando)
  - Persistência em `localStorage` (`rp_vsl_progress_v1`) — retoma posição ao recarregar
  - Estado de início (overlay com Play gigante) e estado de erro (mostra path do arquivo)
  - Mute/unmute toggle, indicador "ao vivo", barra de progresso customizada (assistido vs atual)
- ✅ **LockedCTA** (`LockedCTA.jsx`):
  - Estado bloqueado: "ASSISTINDO VÍDEO..." com % em tempo real e barra de liberação
  - Estado liberado em ≥60%: "CONSULTAR MEU POSSÍVEL REEMBOLSO" com glow pulsante verde
  - Redireciona para `CTA_REDIRECT_URL` (atualmente `#`)
- ✅ Stats grid (3 cards: +47 mil, R$12 mi, 98%)
- ✅ Depoimentos: 3 cards estilo ReclameAqui (avatar, 5 estrelas, valor recuperado, badge verificado)
- ✅ FAQ minimalista (4 perguntas, shadcn Accordion com glow verde no aberto)
- ✅ Footer: logo, tagline, links (Termos/Privacidade/Contato), disclaimer jurídico completo
- ✅ Microinterações: fade-in escalonado, glow respirando na moldura do vídeo, pulse-glow no CTA liberado, hover scale
- ✅ Mobile-first responsivo
- ✅ SEO básico (meta description, keywords, og tags em PT-BR)
- ✅ data-testid em todos os elementos interativos

## Verificação dos Comportamentos Críticos (testado via Playwright)
- ✅ Vídeo reproduzido até 100% → CTA UNLOCKED
- ✅ localStorage persistiu `{"maxWatched":10,"duration":10}`
- ✅ Tentativa de seek para 9s (de 10s) → vídeo voltou para 1.3s, CTA permaneceu LOCKED
- ✅ Lint passou sem erros

## Files Created
- `/app/frontend/src/pages/Landing.jsx`
- `/app/frontend/src/components/vsl/Header.jsx`
- `/app/frontend/src/components/vsl/Hero.jsx`
- `/app/frontend/src/components/vsl/VSLPlayer.jsx`
- `/app/frontend/src/components/vsl/LockedCTA.jsx`
- `/app/frontend/src/components/vsl/CredibilityBullets.jsx`
- `/app/frontend/src/components/vsl/Stats.jsx`
- `/app/frontend/src/components/vsl/Testimonials.jsx`
- `/app/frontend/src/components/vsl/FAQ.jsx`
- `/app/frontend/src/components/vsl/Footer.jsx`
- `/app/frontend/src/lib/constants.js`
- Atualizados: `App.js`, `index.css`, `App.css`, `public/index.html`

## How to add the VSL video
Coloque o arquivo `vsl.mp4` em `/app/frontend/public/vsl.mp4`. O placeholder "Aguardando vídeo" desaparece automaticamente.

## Backlog / Next Tasks
- P1: Substituir CTA_REDIRECT_URL (`/app/frontend/src/lib/constants.js`) pela URL real do site principal
- P1: Adicionar evento de analytics (PostHog já carregado) quando CTA é desbloqueado e clicado
- P2: Pixel do Facebook/Google Ads para tracking de conversão
- P2: Variação A/B do título do hero
- P2: Contagem regressiva ("oferta válida por X horas") para amplificar urgência
- P2: Página de obrigado pós-CTA com captura de WhatsApp
