# Plataforma Proativa (passivo → ativo)

Evolução do Brains de **ferramenta que espera ordens** para **plataforma que
trabalha sozinha e reporta**. Hoje toda feature exige que eu inicie: colar URL
de ticket, colar link de PR, clicar Play. As Automations são o embrião do
proativo, mas ainda são "agendar uma skill num horário" — não reagem ao mundo
e o resultado morre no banco até eu abrir a página certa.

> **Status:** Fase 1 (briefing + ledger + watchdog) entregue. Fase 2 com o
> framework de watchers pronto: **W1** (`github_review_requested`) com
> auto-publish + gates inteligentes (§6.2), **W2** (`github_reviews_received`)
> criando `address_pr_run` gated (§6.2), e o `jira_backlog_assigned` (variante
> do W3, achado → proposal). **Fase 3 (Slack) entregue** em mão-única: notifier
> por DM + digest matinal, ligado por env (§7). A **Fase 4a (planejadora)** —
> lê os boards Jira e gera proposals `source=planner` — também já rodou. Falta
> o bridge bidirecional do Slack (§8.5) e o resto da Fase 4.
> **Objetivo máximo:** devolver tempo. A plataforma detecta, prepara, e eu só aprovo.

---

## 1. A experiência-alvo

Acordo, abro o Brains, e a primeira tela diz:

> **Bom dia. Enquanto você esteve fora:**
> - Revisei 2 PRs onde você é reviewer — as reviews estão prontas, aguardando
>   seu OK pra publicar. [ver] [aprovar]
> - O PR do BEON-123 recebeu feedback do fulano. Já preparei os fixes na
>   worktree — aprova o commit? [ver diff] [aprovar]
> - 3 tickets da NovoED estão no sprint sem spec técnica. Rodo o
>   `/enrich-ticket` neles? [sim] [dispensar]
> - A automação `daily-status` rodou às 08:00. [resumo]
> - ⚠ A automação X falhou ontem à noite. [log]

E durante o dia, quando algo relevante acontece, uma mensagem no Slack com o
link. Eu deixo de ser o **operador** que dispara cada coisa e viro o
**aprovador** que só decide o que sai com meu nome.

---

## 2. Decisões de produto (fechadas)

| Decisão | Escolha | Racional |
|---|---|---|
| Primeira entrega | **Briefing do dia** | A superfície onde tudo aparece; sem ela, o trabalho autônomo é invisível |
| Detecção de eventos externos | **Polling** (webhooks ficam pro horizonte) | Funciona hoje, na minha máquina, sem expor nada na internet. Latência de minutos é irrelevante pro caso de uso |
| Autonomia | **Rascunho + aprovação** | Tudo que é visível para outros humanos (review publicada, push, reply, comentário) pausa em `awaiting_approval`. Preparar é autônomo; publicar é gated |
| Canal de notificação | **Slack** (além da tela) | Me alcança longe do computador; trampolim pra voz no futuro |

---

## 3. Princípios de arquitetura

Herdados de `docs/features/implementations/README.md`, com dois novos:

1. **Reusar os primitivos existentes.** A cadeia proativa já funciona:
   scheduler materializa → runner faz claim (`FOR UPDATE SKIP LOCKED`) → roda
   `claude -p` → PATCH de volta. Watchers, briefing e notificações são novos
   consumidores/produtores desses mesmos primitivos — não uma infra paralela.
2. **Detecção acontece onde as credenciais vivem.** Os `.envrc` por-org
   (`gh`, Jira, Bitbucket) estão no host. Logo, quem consulta o mundo externo
   é o **runner**, não o scheduler. O plano de controle nunca ganha segredos
   novos (princípio 2.3 do doc de implementações continua intacto).
3. **Tudo que a plataforma faz vira evento.** Um ledger único
   (`platform_events`) é a fonte do briefing, do badge de não-lidos e do
   Slack. Sem ledger, cada canal teria que re-agregar N tabelas.
4. **Preparar é grátis, publicar é gated.** O default de qualquer ação nova é
   pausar antes do efeito externo. Flags `auto_publish` por watcher permitem
   afrouxar caso a caso, depois que houver confiança.

---

## 4. Arquitetura geral

```
                        PLANO DE CONTROLE (Docker)
  ┌──────────────────────────────────────────────────────────────────┐
  │  web (3737)                api (4242)              scheduler     │
  │  ┌───────────┐   REST   ┌─────────────────┐    ┌──────────────┐  │
  │  │ /briefing │ ───────► │ /briefing        │    │ run_cycle 5m │  │
  │  │ (landing) │          │ /proposals       │    │ + digest     │  │
  │  │ badge 🔔  │          │ /watchers        │    │   matinal ───┼──┼─► Slack
  │  └───────────┘          │ emit_event() ────┼──► │              │  │   (fase 3)
  │                         └───────┬──────────┘    └──────────────┘  │
  │                                 ▼                                 │
  │        Postgres: platform_events · proposals · watchers ·         │
  │        watcher_sightings · (tabelas run/step existentes)          │
  └──────────────────────────────▲───────────────────────────────────┘
                                 │ claim / PATCH (X-Runner-Token)
                        PLANO DE EXECUÇÃO (host)
  ┌──────────────────────────────┴───────────────────────────────────┐
  │  runner: 6 filas atuais + fila nova de watcher ticks             │
  │  tick → direnv exec <org> → gh / Jira REST → achados → POST api  │
  │  api dedup + cria code_review_run / address_pr_run / proposal    │
  └──────────────────────────────────────────────────────────────────┘
```

Nada muda na topologia: mesmos 4 containers + runner no host. As novidades são
4 tabelas, ~6 endpoints, 1 fila nova no loop do runner e 1 página web.

---

## 5. Fase 1 — Briefing do dia (a superfície)

**Entrega:** abro o Brains de manhã e vejo tudo que rodou, falhou e espera
aprovação — agregado, com deep links. Vira a landing page no lugar do
Dashboard placeholder (`web/src/pages/Dashboard/index.tsx`).

### 5.1. Ledger: tabela `platform_events`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | PK | |
| `occurred_at` | timestamptz | indexado |
| `source` | str | `implementation` \| `code_review` \| `address_pr` \| `automation` \| `watcher` \| `system` |
| `event_type` | str | `run_started` \| `run_finished` \| `run_failed` \| `awaiting_approval` \| `proposal_created` \| `watcher_alert` |
| `title` | str | ex.: "Review pronta: PR #142 web-clientwebsite" |
| `summary` | text | 1–3 linhas, humano |
| `connection_name` | str? | org, quando aplicável |
| `ref_kind` / `ref_id` | str / int | aponta pro run/proposal de origem |
| `url_path` | str | deep link na UI (`/code-review/...`) |
| `seen_at` | timestamptz? | null = não lido → badge |

**Emissão em um único ponto:** os runners já reportam progresso via PATCH nos
endpoints da api. Um helper `emit_event(db, ...)` chamado na camada de service
onde os status transicionam (`automation_service`, `implementation_service`,
services de code review e address-pr) cobre tudo **sem tocar no runner**.
Transições que emitem: entrou em `running`, `done`, `failed`,
`awaiting_approval`.

### 5.2. Tabela `proposals` (a plataforma sugere, eu decido)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | PK | |
| `created_at` | timestamptz | |
| `source` | str | `watcher` \| `manual` (futuro: `planner`) |
| `title` / `description` | str / text | "Rodar /enrich-ticket em NOVO-88, NOVO-91?" |
| `action_kind` | str | `start_code_review` \| `start_address_pr` \| `run_skill` \| `run_automation` |
| `action_payload` | JSONB | tudo que o service precisa pra materializar (org, pr_url, ticket keys, skill) |
| `status` | str | `pending` \| `accepted` \| `dismissed` \| `expired` |
| `result_ref` | str? | run criado ao aceitar |

`POST /proposals/{id}/accept` despacha pelo `action_kind` para os services já
existentes (criar `code_review_run`, `address_pr_run`, `AutomationRun` manual).
Aceitar uma proposta = 1 clique = trabalho começa.

### 5.3. Endpoint `GET /briefing?date=`

Agrega, para o dia (com "desde a última vez que você viu"):

- **Aguardando você:** steps em `awaiting_approval` nas 3 pipelines + proposals `pending`
- **Feito:** eventos `run_finished` agrupados por source, com `result_summary`
- **Falhas:** `run_failed` com link pro log
- **Narrativa:** parágrafo de abertura ("Bom dia. Enquanto você esteve fora...")
- **Custo:** soma dos custos Claude do dia (o runner já captura)

Narrativa v1 = template determinístico em PT-BR montado pela api (o plano de
controle não tem Claude). Narrativa v2 (fase 3+) = job leve no runner com
haiku, pra ganhar a "voz" de verdade.

### 5.4. Página `/briefing`

Seções na ordem de valor: **Aguardando aprovação** (cards com approve/dismiss
inline, chamando os endpoints de approve já existentes) → **Propostas** →
**Falhas** → **Timeline do dia**. Badge no menu com contagem de `seen_at IS
NULL`; abrir a página marca como visto. Reusar o padrão de polling condicional
(liga só com run ativo).

### 5.5. Hardening que entra junto (pequeno e necessário)

- Adicionar `Automation`/`AutomationRun` ao `__all__` de
  `api/app/models/__init__.py` (hoje só o scheduler importa — armadilha pro
  Alembic autogenerate).
- Watchdog no `run_cycle`: run `running` com `claimed_at` velho demais (runner
  morreu no meio) → marca `failed` + `platform_event`. Runs `pending`
  acumulando além de X min (runner parado) → evento `watcher_alert` ("runner
  parece offline"). Hoje isso falha em silêncio.

**Por que fase 1 e não depois:** o ledger é pré-requisito dos watchers (fase 2)
e do Slack (fase 3). E já entrega valor imediato: as automações existentes
ganham visibilidade que hoje não têm.

---

## 6. Fase 2 — Watchers (a plataforma percebe o mundo)

**Entrega:** os 3 fluxos que hoje dependem de eu perceber e colar um link
passam a acontecer sozinhos, parando no gate de aprovação.

### 6.1. Framework

Tabela `watchers`:

| Campo | Tipo | Notas |
|---|---|---|
| `kind` | str | `github_review_requested` \| `github_reviews_received` \| `jira_enrich_candidates` |
| `connection_name` | str | org (escopo do `.envrc`) |
| `config` | JSONB | repos, JQL, filtros |
| `interval_minutes` | int | default 10 |
| `enabled` | bool | |
| `auto_start` | bool | achado → cria run direto (true) ou proposal (false) |
| `auto_publish` | bool | default **false**: run para em `awaiting_approval` antes de efeito externo |
| `last_run_at` / `last_status` / `last_error` | | visíveis na UI |

Tabela `watcher_sightings` (dedup): `watcher_id` + `external_key` (ex.:
`pr_node_id:review_id`) únicos, `first_seen_at`, `handled_ref`. Garante que um
PR visto duas vezes não vira dois runs.

**Execução no runner** (princípio 2): fila nova no loop principal
(`runner/runner.py::main`), mesmo padrão das 6 existentes:

1. `POST /watchers/runner/claim` → api entrega watcher devido
   (`last_run_at + interval <= now`, claim atômico).
2. Runner roda o check via `direnv exec <org>`: `gh` CLI pro GitHub, Jira REST
   (reusa os scripts inline de `runner/steps.py`), MCP Bitbucket pra Ecointeractive.
   É consulta leve — sem Claude, custo zero.
3. `PATCH` devolve os achados; a api dedup contra `watcher_sightings` e, pros
   novos, cria run ou proposal + `platform_event`.

*Alternativa rejeitada:* polling no scheduler usando os PATs de
`productivity_connections`. Cobriria só GitHub — Jira e Bitbucket exigiriam
copiar segredos pro plano de controle, violando o princípio do `.envrc` como
fonte única.

### 6.2. Os três watchers

**W1 — `github_review_requested`** (PRs esperando minha review)
`gh search prs --review-requested=@me --state=open` no escopo da org. PR novo →
cria `code_review_run` (com `auto_publish=true` por default; desligável por
watcher). O runner roda `review_draft` e, em vez de sempre pausar, **publica
sozinho** conforme a ação decidida:
- `comment` / `request_changes` → posta direto (nunca "abençoam" o PR);
- `approve` → só posta se a checagem determinística (`gh pr view` →
  `state == OPEN` e `reviewDecision != CHANGES_REQUESTED`) confirmar que é
  seguro; senão **pausa em `awaiting_approval`** pra eu decidir.

**Gate secundário (freshness):** antes de qualquer `post_review`, o runner
re-checa o estado do PR — se fechou/mergeou desde que o run nasceu, **descarta**
a review (step `skipped`, run `done`) e registra no briefing, em vez de comentar
num PR morto. Vale pros runs manuais também.

**W2 — `github_reviews_received`** (feedback nos meus PRs) — ✅ **entregue**
Meus PRs abertos vêm de `gh search prs --author=@me --state=open -- draft:false`
(cobre multi-repo por org); pra cada um, `gh pr view <url> --json reviews,comments`
extrai o feedback. Cada item acionável de terceiros vira um sighting
(`repo#pr:review:<id>` / `:comment:<id>`) — reviews `APPROVED` sem corpo e
comentários meus são filtrados. Achado novo → cria `address_pr_run` que roda
`fix_draft` e **pausa nos gates existentes** (antes de `commit_push` e de
`post_replies`). Dedup por `address_pr_service.has_active_run_for_pr`: só o
primeiro feedback por PR cria run; os demais (enquanto ele está aberto) são
registrados mas não forkam um segundo. No briefing/Slack: "Preparei fixes pro
feedback no BEON-123 — aprova?"

**W3 — `jira_enrich_candidates`** (tickets precisando de spec)
JQL por org (ex.: sprint aberto, sem comentário "Technical Implementation
Spec"). Achado → **sempre proposal**, nunca run direto (comentário no Jira é
visível pro time): "3 tickets precisam de enrichment. Rodo o `/enrich-ticket`?"
Aceitar dispara a skill via runner por ticket.

### 6.3. Matriz de autonomia (default v1)

| Ação | Preparar | Publicar |
|---|---|---|
| Review de PR alheio (W1) — comment / request_changes | ✅ auto | ✅ auto |
| Review de PR alheio (W1) — approve | ✅ auto | ✅ auto se seguro / ⏸ gate se risco |
| Fixes + replies nos meus PRs (W2) | ✅ auto | ⏸ gate (2 gates existentes) |
| Enrich de ticket (W3) | — | ⏸ proposal antes até de preparar |
| Automations atuais | ✅ auto | ✅ auto (comportamento atual, sem mudança) |

Afrouxar = virar `auto_publish`/`auto_start` por watcher na UI, quando a
confiança justificar. O caminho pra "publicar direto" existe, mas é opt-in.

### 6.4. UI

Página `/watchers` (ou aba em Automations): CRUD no padrão do
`AutomationFormModal`, com `last_run_at`/`last_error` visíveis e histórico de
sightings. Watchers são primos das Automations: **Automation = gatilho por
tempo; Watcher = gatilho por estado do mundo.**

---

## 7. Fase 3 — Slack (a plataforma te alcança) — ✅ entregue (mão-única)

**Entrega:** não preciso abrir o Brains pra saber que algo espera por mim.

- `api/app/services/notifier.py`: adapter Slack (bot token + user id pra DM em
  `api/.env`, scopes `chat:write` + `im:write`). Consome `platform_events` —
  roteamento por `event_type` em `NOTIFY_EVENT_TYPES`: `awaiting_approval`,
  `proposal_created` e `run_failed` notificam; `run_started` e o resto não.
- **Ligado por env, não por `user_preferences`.** `platform_events` são globais
  do operador (não têm `user_id`), então gatear por presença de
  `SLACK_BOT_TOKEN`+`SLACK_USER_ID` (como o `RUNNER_TOKEN`) é mais simples e
  correto que uma linha de preferência ambígua. Toggle na UI de Settings fica
  como refinamento futuro (aí sim com migração).
- Envio no próprio `emit_event` (best-effort com timeout curto, nunca bloqueia
  o fluxo; falha de Slack vira log, não erro de run). Dispara antes do commit —
  aceitável no volume atual, não há post-commit hook.
- **Digest matinal:** `maybe_send_daily_digest` no `run_cycle` do scheduler — no
  `planner_hour` do operador, monta o briefing e posta no Slack com link pra
  `/briefing`. Dedup por um `platform_event` `digest_sent` (uma vez por dia UTC,
  sobrevive a restart) — sem coluna/migração nova.
- Limitação aceita: botões interativos do Slack exigem URL pública (Request
  URL) — fora do escopo até existir túnel/VPS (fase 4). v1: mensagens carregam
  deep links pra UI local. Aprovar continua sendo 1 clique, só que na web.

---

## 8. Fase 4 — Horizonte (não detalhar agora, não esquecer nunca)

1. **Webhooks + túnel/VPS:** cloudflared ou runner num VPS (OpenClaw) →
   latência zero, botões interativos no Slack, plataforma 24/7 mesmo com meu
   Mac desligado. O desenho de filas não muda: webhook receiver vira só mais
   um produtor de sightings.
2. **Planner ("ela pensa"):** job periódico com Claude que lê o estado da
   plataforma (events, tickets, PRs, histórico) e **gera proposals que nenhum
   watcher hardcoded previu**. Os watchers são reflexos; o planner é intenção.
   A tabela `proposals` já nasce pronta pra receber `source: planner`.
3. **Voz:** o briefing falado (TTS do texto que a fase 1 já gera) é o passo
   barato; conversa fluida por voz (realtime API) é o passo caro. Slack no
   celular é o trampolim intermediário.
4. **Resumo do dia a partir do board da Jira:** visitar o sprint/board ativo
   (todas as orgs) e gerar, dentro da narrativa do `/briefing` ("Bom dia..."),
   um resumo do que o dia poderia ser — tickets no sprint, prioridades,
   o que está travado/parado. É uma instância concreta do planner (item 2
   acima) aplicada à narrativa: hoje ela só reporta o que já rodou (seção
   5.3); essa ideia faz ela também sugerir o que fazer. Puramente leitura no
   V1 (sem criar proposal/run) — só enriquece o texto de abertura do
   briefing. *(Parte da 4a já entregou proposals a partir do board; falta a
   narrativa enriquecida no `/briefing`.)*

5. **Slack bidirecional (a plataforma me ouve e responde):** hoje o Slack é
   mão-única (§7). O upgrade é **Socket Mode** — o app-level token
   (`xapp-...`) recebe `message.im` por WebSocket **sem URL pública**, então
   funciona no Mac hoje, diferente dos botões interativos (que exigem Request
   URL, item 1). Desenho:
   - Ligar o *Messages Tab* no App Home (senão o Slack bloqueia o envio pro app).
   - Um **bridge no runner** (princípio 2: é onde vivem credenciais e skills)
     escuta os eventos via Socket Mode; cada DM minha vira um `claude -p` com
     contexto do Brains (proposals pendentes, status de runs) e a resposta
     volta na thread.
   - Escopo natural: **comandar a plataforma por conversa** — "aprova a proposta
     X", "status do BEON-123", "roda /enrich no NOVO-88" — reaproveitando os
     `action_kind` de `proposals` e os services de run já existentes. É o
     trampolim concreto pra "voz" (item 3): texto no Slack primeiro, TTS/realtime
     depois. Alternativa off-the-shelf pra chat genérico (sem contexto do
     Brains): o app oficial "Claude no Slack".

---

## 9. Ordem, dependências e tamanho

| Fase | Depende de | Tamanho relativo | Valor entregue | Status |
|---|---|---|---|---|
| 1. Briefing + ledger + hardening | — | **M** (2 tabelas, 3 endpoints, 1 página, emit nos services) | Visibilidade total do que já roda; 1 clique pra aprovar | ✅ |
| 2. Watchers | Fase 1 (ledger/proposals) | **L** (2 tabelas, fila nova no runner, 3 checks, UI) | O fim do "colar link de PR" — o core do tempo devolvido | ✅ W1+W2+backlog |
| 3. Slack (mão-única) | Fase 1 (eventos) | **S** (1 adapter, roteamento, digest) | Alcance fora da tela | ✅ |
| 4a. Planejadora (Jira board) | Fase 1 (proposals) | **M** (planner_run, síntese haiku no runner, Insights) | Ela sugere o que fazer, não só reporta | ✅ |
| 4. Horizonte (webhooks/VPS, planner amplo, Slack bidirecional, voz) | Fases 1–3 | — | 24/7, conversa, voz | — |

Fases 2 e 3 eram independentes entre si — foram entregues nas duas ordens ao
longo do caminho.

---

## 10. Riscos e pontos em aberto

- **Runner offline = plataforma cega e muda.** Mitigado pelo watchdog da fase
  1 (alerta) e resolvido de verdade só no VPS (fase 4). Aceitável: se o Mac
  está desligado, eu também não estou trabalhando.
- **Rate limits GitHub/Jira:** intervalos de 10 min com `gh search` escopado
  são ordens de magnitude abaixo dos limites. Monitorar via `last_error`.
- **Reviews de IA publicadas com meu nome:** o gate resolve o risco, mas o
  custo de revisar a review precisa ser menor que revisar o PR — o card de
  aprovação deve mostrar a review inteira, não só "aprovar?".
- **Dedup entre watcher e ação manual:** se eu mesmo iniciar um code review de
  um PR que o W1 acabou de ver, pode duplicar. Checar runs existentes pro
  mesmo `pr_url` antes de criar (a api tem essa informação).
- **Em aberto:** briefing deve virar a rota default pós-login? (proposta: sim);
  retenção de `platform_events` (proposta: ilimitada por ora, é texto);
  frequências intraday nas Automations atuais (proposta: adiar — watchers
  cobrem o caso de uso real).
