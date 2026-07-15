# Model Selection & Strix De-fragilization — Analysis & Proposal

**Date:** 2026-07-13
**Status:** Proposal (not yet implemented)
**Author:** Engineering

This document captures (1) why the current Strix integration is fragile, (2) the 2026 LLM
landscape and per-scan cost math, (3) a proposed rebuild that removes the fragility, and
(4) a prioritized catalog of everything else worth fixing.

> All model facts, prices, and dates below were gathered from live web sources on 2026-07-13.
> Cost figures are **estimates** built on assumed token volumes and cache-hit rates — validate
> against real telemetry before committing. Source URLs are inline.

---

## 1. The core problem: our Strix integration depends on internals that no longer exist

We embed Strix **in-process** via undocumented internals:
`StrixAgent().execute_scan(config)`, the `Tracer` telemetry object, and the module-level
mutable state in `strix.tools.agents_graph.agents_graph_actions` (`_agent_graph`,
`_agent_instances`). On top of that we **monkey-patch the installed package**
(`apply_strix_patches.py` string-replaces `return elapsed > 600` and
`parent_id = agent_state.agent_id`) to add a wait-timeout and an agent cap.

Two independent failure sources result:

- **Silent patch failure.** If upstream changes those exact lines, the patches skip with a
  warning and we quietly lose the agent cap + timeout. There's no test that asserts the
  patch took.
- **Global-state bleed.** `_agent_graph`/`_agent_instances` persist between scans, so a new
  scan can inherit the previous scan's cost and immediately trip its cost limit. We already
  had to add a manual reset (commit `c170b9a`) to work around this.

The result is `strix_runner.py` — ~1,100 lines, most of it defensive fallback trying to
recover findings when the agent doesn't call `finish_scan` (read tracer memory → read disk
files → read progress JSON → synthesize a report from any source).

### What actually changed upstream (this is the decisive finding)

**Strix v1.0.0 (2026-05-26) was a ground-up rewrite that removed every internal we import.**
Latest is **v1.0.4 (2026-06-09)**. Requires Python ≥ 3.12, Apache-2.0.

| We currently call (pre-1.0) | Status in v1.0.x |
|---|---|
| `StrixAgent` / `agent.execute_scan(config)` | **Gone.** Entry point is `async def run_strix_scan(*, scan_config, scan_id, image, coordinator, max_turns, max_budget_usd, model, event_sink, …)` in `strix/core/runner.py`. Agents are `SandboxAgent` built by `build_strix_agent()`. |
| `Tracer` (`strix/telemetry/tracer.py`) | **Gone.** Replaced by `ReportState` / `get_global_report_state()` in the new `strix/report/` package (with `sarif.py`, `dedupe.py`, `writer.py`). |
| `agents_graph_actions._agent_graph`, `_agent_instances` | **Gone.** Orchestration moved into an `AgentCoordinator`; switched from `threading` to `asyncio` + the **OpenAI Agents SDK**. |
| `finish_scan` tool | **Does not exist in 1.0.x.** Scans end via `max_turns` / `max_budget_usd` or the root agent calling `agent_finish`. Findings are written by `create_vulnerability_report` into `ReportState`. |

Sources: [PyPI](https://pypi.org/project/strix-agent/) ·
[v0.8.3 tracer](https://raw.githubusercontent.com/usestrix/strix/v0.8.3/strix/telemetry/tracer.py) ·
[current runner.py](https://raw.githubusercontent.com/usestrix/strix/main/strix/core/runner.py) ·
[reporting tool](https://raw.githubusercontent.com/usestrix/strix/main/strix/tools/reporting/tool.py) ·
[releases](https://github.com/usestrix/strix/releases)

**Two consequences:**

1. "Pull latest Strix from GitHub" is **not a version bump** — the adapter must be rewritten
   regardless, because the symbols we import were deleted.
2. The rewrite gives us **native `max_turns` and `max_budget_usd`**, which makes
   `apply_strix_patches.py` (and most of the reset/recovery code) obsolete.

### Strix has no supported Python API — it's a CLI

The docs (docs.strix.ai) cover only the CLI/TUI, GitHub Actions, and a headless mode
(`strix -n --target …`, non-zero exit on findings). There is **no documented embedding
API**; what we use are private internals the maintainers don't treat as a contract. The
maintainer-sanctioned integration is: run the **headless CLI**, read the emitted
**JSON + SARIF** from the run directory. There is also a streaming `event_sink` param on
`run_strix_scan` for live progress if we do stay in-process.

**Live reliability caveats (open v1.0.x issues, July 2026):**
[#725](https://github.com/usestrix/strix/issues/725) scans "loading for hours without export";
[#727](https://github.com/usestrix/strix/issues/727) shell tool hangs, "burned 1.8M tokens";
[#712](https://github.com/usestrix/strix/issues/712) "Docker not available". Budget/turn caps
+ hard wall-clock timeouts are mandatory either way.

Strix's **currently recommended models** (README v1.0.4): `openai/gpt-5.4`,
`anthropic/claude-sonnet-4-6`, `vertex_ai/gemini-3-pro-preview`. Our `openai/gpt-5.2` is no
longer a recommended default.

---

## 2. Model landscape & per-scan cost (2026-07-13)

**Token assumptions.** Quick scan ≈ 1–3M input / 150–400K output. Deep scan ≈ 5–15M input /
500K–1.5M output. A pentest agent is a near-ideal **prompt-caching** workload (stable prefix:
system prompt + tool schemas + target dossier + prior findings, replayed each step), so the
"cached" columns are the realistic ones. Caching cuts the input bill ~75–80% and is a bigger
lever than model choice within a tier.

### OpenAI (official pricing: [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing))

**GPT-5.6 is real** — GA 2026-07-09, three tiers Sol > Terra > Luna, ~1M context, full tool
stack. OpenAI markets it as its "strongest cybersecurity model yet" (threat modeling, code
review, blue teaming) — [TechCrunch](https://techcrunch.com/2026/07/09/openai-launches-its-new-family-of-models-with-gpt-5-6/).
GPT-5.2 (what we use) is now previous-gen; OpenAI's docs recommend upgrading.

| Model | Input / Cached / Output (per 1M) | Quick (cached) | Deep (cached) |
|---|---|---|---|
| gpt-5.2 (current) | $1.75 / $0.175 / $14.00 | ~$4.50 | ~$17 |
| **gpt-5.6-terra** | $2.50 / $0.25 / $15.00 | ~$5 | ~$20 |
| gpt-5.6-sol | $5.00 / $0.50 / $30.00 | ~$10 | ~$40 (~$20 on Flex) |
| gpt-5.6-luna | $1.00 / $0.10 / $6.00 | ~$2 | ~$8 |
| gpt-5.4-mini | $0.75 / $0.075 / $4.50 | ~$1.50 | ~$6 |

Notes: 5.6 adds a **cache-write** premium (Sol 1.25× input) — a modest single-digit-dollar
add-on per deep scan. **Flex tier = 50% off** and fits background scans perfectly. LiteLLM
strings: `openai/gpt-5.6-terra`, `openai/gpt-5.6-sol`, `openai/gpt-5.6-luna`.

### Open-weight / alternative (hosted, cache-miss unless noted)

| Model | License | Ctx | In / Out (per 1M) | Deep scan (uncached) |
|---|---|---|---|---|
| DeepSeek V4 Pro | open weights (license unclear) | 1M | $0.435 / $0.87 | ~$2.6–7.8 (~$2 cached) |
| DeepSeek V4 Flash | open weights | 1M | $0.14 / $0.28 | ~$0.8–2.5 |
| GLM-4.6 | **MIT** | 200K | $0.43 / $1.75 | ~$3–9 |
| Qwen3-Coder 480B | **Apache-2.0** | 1M | $0.22 / $1.80 | ~$2–6 |
| MiniMax M2 | MIT | 205K | $0.255 / $1.02 | ~$1.8–5.4 |
| Kimi K2.6 | Modified-MIT | 262K | $0.95 / $4.00 | ~$6.8–20 |
| Claude Opus 4.8 (ref) | proprietary | — | $5.00 / $25.00 | ~$38–113 (~$14 cached input) |

Sources: [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/) ·
[OpenRouter DeepSeek V4 Pro](https://openrouter.ai/deepseek/deepseek-v4-pro) ·
[GLM-4.6 (HF, MIT)](https://huggingface.co/zai-org/GLM-4.6) ·
[Qwen3-Coder](https://openrouter.ai/qwen/qwen3-coder) ·
[Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
DeepSeek **R2 does not exist** yet (folded into V4).

**Two hard constraints on the cheap open-weight APIs:**

- **Data residency.** DeepSeek, Moonshot (Kimi), Zhipu (GLM), Qwen, MiniMax first-party APIs
  are **China-hosted**. Sending client targets / vuln details / creds there is very likely a
  compliance non-starter for a pentest SaaS. Realistic path = same open weights via a
  **Western host** (Fireworks/Together/DeepInfra/Novita, routable via OpenRouter) or self-host.
- **Reliability gap.** On structured tool-use benchmarks (tau2-bench) the best open models now
  match frontier, but for **long-horizon, self-recovering** tool loops in an adversarial
  pentest, Claude / GPT-5.x still hold a real edge (fewer derailments, better recovery from
  malformed calls, better instruction-following on messy tool output). Benchmarks like BFCL
  under-measure this (Claude's low BFCL score is an AST-parsing artifact, not a real deficit).

**Self-hosting is a data-control decision, not a cost win.** Hosted open-weight APIs are so
cheap (DeepSeek V4 Pro $0.435/$0.87) that break-even vs. renting GPUs is tens of millions of
tokens/month of *sustained* load; bursty scan traffic makes owned GPUs wasteful. Indicative
self-host: GLM-4.6 ≈ $11–15k/mo (6–8× H100); DeepSeek V4 Pro ≈ $33–43k/mo (16–24× H100).

---

## 3. Recommended model strategy

1. **Scanning engine (Strix `STRIX_LLM`):** default **`openai/gpt-5.6-terra`** — OpenAI's
   cyber-tuned frontier, 1M context, full tool stack, fits our cost caps (~$5 quick / ~$20
   deep cached). Use **`gpt-5.6-sol`** for the Deep tier where reasoning depth matters
   (consider the **Flex** tier to halve it). Keep the control loop on a frontier model — the
   5–15× premium over open weights buys reliability on long autonomous runs, which is the
   whole product.
2. **Cost-sensitive quick tier (optional):** a **Western-hosted DeepSeek V4 Pro / GLM-4.6**
   could power the free/quick tier at ~$1–2/scan if we accept the reliability trade and clear
   the data-handling boundary. Defer until the core rebuild is done.
3. **Report processor (`report_processor.py`):** currently `gpt-5.2` for structured-output
   extraction — an easy, bounded task. Downgrade to **`gpt-5.6-luna`** or **`gpt-5.4-mini`**
   (~5–10× cheaper, structured outputs stay reliable).
4. **Engineer for prompt caching + structured-output validation/retries regardless of model.**
   That saves more money and prevents more failures than the model choice itself.

Config already supports per-tier models (`tier_quick_llm` / `tier_pro_llm` / `tier_deep_llm`),
so this is a config change, not code — once the adapter is rebuilt.

---

## 4. Rebuild: headless CLI + run-dir JSON  (adapter BUILT, behind a flag)

**Goal:** depend only on Strix's *supported* surface so upstream releases stop breaking us,
and delete the fragile in-process scaffolding.

### The real 1.0.4 contract (verified against source — corrects earlier assumptions)
- **No SARIF.** Strix 1.0.4 does *not* emit SARIF (there is no `sarif.py`). Findings live in
  `strix_runs/<run>/vulnerabilities.json` — a **bare JSON array** of vuln objects; usage in
  `run.json` (`llm_usage`, `status`); plus `vulnerabilities.csv`, `penetration_test_report.md`,
  per-finding `.md` files, and `strix.log`.
- **CLI flags are minimal:** `-t/--target`, `--instruction(-file)`, `-n/--non-interactive`,
  `-m/--scan-mode {quick,standard,deep}`, `--scope-mode`, `--config`, `--resume`. **No flag for
  model, iterations, budget, output dir, concurrency, or timeout.** Model → env `STRIX_LLM`;
  output → `<cwd>/strix_runs/<auto_run_name>/` (we set a per-scan CWD); **budget is not enforced
  by Strix at all**.
- **Exit codes:** `0` = clean, `2` = vulnerabilities found, `1` = error/interrupt. `2` is a
  success signal, not a failure.
- **No progress stream.** `vulnerabilities.json`/`run.json` update incrementally, so we poll the
  run dir for live findings + cost.
- **Docker mandatory**, image `ghcr.io/usestrix/strix-sandbox:1.0.0`.

### What was built this session (`app/strix_adapter.py`, gated by `settings.strix_use_cli`)
```
worker → run_strix_scan_async(...)            # unchanged signature
       → (flag on) run_strix_cli_scan_async(target, scan_type, scan_id)
          → subprocess: strix -n -t <url> -m <mode>   (env STRIX_LLM, per-scan CWD)
          → poll strix_runs/<run>/{vulnerabilities.json, run.json} every 5s
             → write progress_json (cost, findings, phase)
             → enforce cost limit + wall-clock ceiling by SIGKILL of the process group
          → on exit: parse vulnerabilities.json → findings; map fields; run report_processor
             on penetration_test_report.md → structured_report
          → interpret_result(): exit 0/2/1 + fail-loud (no findings AND no report ⇒ failed)
```
- **Cost control preserved without in-process coupling:** since the CLI has no budget cap, the
  adapter polls `run.json.llm_usage` and kills the process when the tier `cost_limit` (or the
  per-mode wall-clock ceiling) is exceeded.
- **Field mapping** vuln→schema: `title`, `severity` (enum or CVSS bucket), `endpoint`(→`target`),
  `impact`(→`description`), `reproduction_steps`←`technical_analysis`/`poc_description`,
  `poc`←`poc_script_code`, `fix_guidance`←`remediation_steps`.
- **Tested:** `tests/test_strix_adapter.py` — 6 passing unit tests over the pure parsers/mappers
  against synthetic 1.0.4 fixtures (parsing, severity/CVSS bucketing, usage extraction, exit-code
  interpretation, run-dir discovery).
- **Also updated:** `worker.cleanup_strix_containers` now matches any `strix-sandbox` tag
  (0.1.11 and 1.0.0).

### What flipping the flag deletes (once validated)
`apply_strix_patches.py` (no more monkey-patching); the global-state reset block; the ~5-layer
finding-recovery / report-synthesis scaffolding in `strix_runner.py` (a subprocess starts clean
and either produces `vulnerabilities.json` or is marked failed).

### Known trade-offs / downgrades with the CLI path
- **Live "war room" fidelity drops:** no agent-graph access, so `active_agent_list` /
  `recent_activity` are empty — the scan UI still shows cost, findings, and phase. Can be
  enriched later by tailing `strix.log`.
- **Requires upgrading to `strix-agent==1.0.4`** (which breaks the current in-process path — hence
  the flag) **and a Docker daemon that can pull `strix-sandbox:1.0.0`.**

### ✅ Source-validated against the real 1.0.4 wheel (2026-07-14)
Downloaded `strix-agent==1.0.4` and read `report/writer.py`, `report/state.py`, `report/usage.py`,
`core/paths.py`, `interface/main.py`. Confirmed the adapter is correct on every non-runtime point:
- CLI flags `-t/-n/-m {quick,standard,deep}` and exit codes **0=clean / 2=findings / 1=error** (in
  `main()`: `sys.exit(2)` iff non-interactive + vulnerability_reports).
- Output filenames + location (`<cwd>/strix_runs/<run_name>/{run.json, vulnerabilities.json (bare
  array), penetration_test_report.md}`) and all vuln fields → my mapping matches.
- `llm_usage` is **flat** (`serialize_usage(...)` + top-level `cost`, `input_tokens`,
  `output_tokens`) — `extract_usage` reads it correctly.
- **Cost-kill is viable:** `state.save_run_data()` rewrites `run.json` on every finding AND every
  recorded model cycle (`record_sdk_usage`), so mid-scan cost polling sees real numbers.
- Startup order (`check_docker_installed` → `pull_docker_image` → `validate_environment` →
  `warm_up_llm`) means a live run needs Docker + a working `STRIX_LLM`/`LLM_API_KEY` before scanning.

### ✅ Live-validated with a real scan (2026-07-14)
Installed `strix-agent==1.0.4` in an isolated venv, pulled `strix-sandbox:1.0.0`, and ran a real
capped `quick` headless scan (`strix -n -t <target> -m quick`, model `openai/gpt-5.2`):
- Run dir landed at `<cwd>/strix_runs/internal-shipcbs-com_5acb` — exactly the layout
  `_discover_run_dir` expects.
- `run.json` present and **`status: running` mid-scan** → confirms live updates → cost-kill works.
- `llm_usage` was **flat** with the exact keys `cost` / `input_tokens` / `output_tokens` /
  `total_tokens` / `requests` / `agents` (+ *_details) — real values `cost=$0.9337`,
  `input_tokens=2,903,864`, `output_tokens=12,933`.
- **The adapter's own `read_run_json` + `extract_usage` parsed the real artifact and matched it
  exactly** (`ADAPTER MATCHES REAL run.json: True`).
- Caveat: the capped run found nothing (still in recon at 420s), so `vulnerabilities.json` wasn't
  exercised with a real finding — but its format is confirmed by `writer.py` source + the 6 unit
  tests. A scan against a local vulnerable benchmark would close that with real data if desired.

### ✅ strix-agent 1.1.0 (released 2026-07-14) — verified backward-compatible
Diffed 1.1.0 vs 1.0.4 on every adapter-critical file. The rebuild needs **zero changes**:
- CLI flags `-n/-t/-m {quick,standard,deep}` and the findings exit code `sys.exit(2)` — unchanged
  (`interface/main.py`).
- Output files `run.json`, `vulnerabilities.json` (still `json.dumps(vulnerability_reports)` — a
  bare array), `penetration_test_report.md` — same names/format (`report/writer.py`).
- `core/paths.py` byte-for-byte identical (run-dir layout); `report/usage.py` only *added* a
  `total_cost` property (the `llm_usage` shape is unchanged); sandbox image still
  `strix-sandbox:1.0.0` (no new pull).
- 1.1.0 *adds* SARIF output (`report/sarif.py`) and `--target-list`/`--mount` flags — additive,
  unused by us (though SARIF is now a future option if we ever want it).
**Cutover pin target is now `strix-agent==1.1.0`.** This is the whole point of the
supported-surface design: a same-day minor release landed and the adapter just worked — the old
in-process integration would have broken silently, exactly as it did across 0.x → 1.0.

### Remaining work before flipping `strix_use_cli=True` in prod
1. Install `strix-agent==1.0.4` in a Docker-capable environment and run one real headless scan;
   confirm the run-dir filenames + `vulnerabilities.json`/`run.json` shapes match the adapter
   (the `llm_usage` sub-shape is the least-certain part — `extract_usage` probes defensively).
2. Set the scan `STRIX_LLM` (e.g. `openai/gpt-5.6-terra`) and validate cost polling/kill.
3. Add a CI smoke test that runs a headless scan against a known-vulnerable target and asserts a
   non-empty `vulnerabilities.json`, so an upstream break is caught before deploy.
4. Flip the flag, watch a few scans, then delete `apply_strix_patches.py` + the recovery code.

**Alternative considered — stay in-process on the v1.0 API** (`run_strix_scan(...)` +
`ReportState`): richer live events + a real `max_budget_usd`, but recouples us to undocumented
internals that already broke once. Rejected as the default; the subprocess boundary is the
durable fix. Revisit only if CLI live-progress fidelity proves insufficient.

---

## 5. Everything else — prioritized fix catalog

### 🔴🔴 Unpinned Strix = the likely cause of the 75% failure rate — ✅ STOPGAP APPLIED
`backend/Dockerfile` ran `pip install strix-agent` **unpinned**. The code targets the 0.x
Python API; **strix-agent 1.0.0 (2026-05-26) deleted all of it**. So any clean image rebuild
pulls 1.0.4 and every scan dies at the first import (`from strix.agents.StrixAgent import
StrixAgent`) — which matches production exactly: **75/100 scans failed, every failure with 0
tools executed** (they die before doing any work). Docker layer caching is the only reason the
other 25 ever ran (an old 0.x install cached in a layer). Verified locally: the current code's
Strix symbols import on **0.7.0** and are **absent** in 1.0.x.
**Done:** pinned `strix-agent==0.7.0` in the Dockerfile (0.7.0 is the version verified against
this code). ⚠️ Deploying this **busts the Docker cache and forces a fresh install → smoke-test
one real scan immediately after deploy.** This is a stopgap; the real fix is the §4 rebuild to
1.0.x. Also confirmed from prod: **all 100 scans `paid_tier: null`** — zero conversions ever,
even on the 25 that completed, so broken payments + low-value/empty reports both bite.

### 🔴 Correctness / revenue — ✅ FIXED this session
- **Lost payments (no PaymentIntent reconciliation).** The embedded checkout only recorded a
  purchase on the inline no-redirect path; redirect flows (3DS / Link) and the
  `payment_intent.succeeded` webhook event were unhandled, so those payments were silently lost.
  **Done:** (1) new shared `app/payments.py::apply_paid_tier()` applies the tier + spawns the
  child scan idempotently by Stripe payment id; (2) `webhooks.py` now handles
  `payment_intent.succeeded` (the server-side safety net) as well as
  `checkout.session.completed`, both routed through the shared helper; (3) `confirm-payment`
  uses the same helper so a payment delivered by both channels only takes effect once;
  (4) the results page now reconciles a `?payment_success=true` redirect by polling until the
  tier lands, then swaps in the unlocked report.
  **⚠️ Manual step:** enable the **`payment_intent.succeeded`** event on the Stripe webhook
  endpoint in the Stripe dashboard (currently only `checkout.session.completed` is likely on).
- **Hosted-checkout success redirect 404.** `create_checkout` sent buyers to
  `/results/{id}/full`, a route that doesn't exist — they paid and hit a 404. **Done:** now
  redirects to `/results/{id}?payment_success=true&tier=…`; the payment-received email link
  was pointing at the same dead `/full` route and is fixed too.

### 📊 Analytics & attribution — ✅ ADDED this session
First-party tracking so we can answer "where do scans come from" and "who wanted to buy but
didn't" from our own data (a dev audience blocks Google Analytics heavily, so first-party is
the source of truth; GA events still fire best-effort).
- **DB:** attribution columns on `scans` (`utm_source/medium/campaign`, `referrer`,
  `landing_page`) + a new `events` table (session-scoped funnel events).
- **Ingestion:** `POST /events` (`routers/events.py`); frontend `lib/analytics.ts` provides
  `captureAttribution()` (first-touch), `getSessionId()`, and `track()`.
- **Funnel events wired:** `scan_started` → `results_viewed` → `checkout_opened` →
  `checkout_tier_selected` → `payment_started` → `payment_succeeded` / `payment_failed`.
- **Readout:** `GET /scans/admin/analytics?key=<ADMIN_API_KEY>` returns total scans, paid
  count, conversion rate, estimated revenue, **scans-and-conversions by source**, and the
  **funnel** (distinct sessions per step). This is where the 100-scans/0-sales story becomes
  legible: if `checkout_opened` ≫ `payment_succeeded`, the paywall/pricing is the problem; if
  `scan_started` ≫ `checkout_opened`, the report isn't creating buy intent.

### 🟢 Reliability quick-wins — ✅ SHIPPED this session (pre-rebuild stopgaps)
Diagnosed from real scan data (local DB: 20/30 failed; 7/10 "completed" had empty reports):
- **False "clean" reports fixed.** `strix_runner` now returns a failure instead of a hollow
  success when a scan produces neither a structured report nor findings — that was the
  "$5 scan → 100% clean, no data" bug. A genuinely clean target still yields a report.
- **Report-extraction rate-limit retries.** `report_processor` retries transient OpenAI errors
  (rate limit / timeout) with backoff before falling back to the empty "Indeterminate" report.
- **NoneType crash guard** in the cost-limit wrap-up (`min(None, …)` → hardened).
- **Remaining failure causes are NOT fixed by code** and need ops/rebuild: OpenAI
  rate-limit/auth (raise quota, verify key), worker restarts (partly helped by the
  `Settings(extra="ignore")` fix), and Strix agent deadlocks (needs the §4 rebuild).
  ⚠️ These stopgaps are verified by syntax/import/type checks + logic review only — **not**
  against a live scan (no Docker/Strix here); validate on a real scan before trusting them.

### 📊 Autocapture — ✅ ADDED this session
Extended the first-party analytics (no PostHog, per decision) with global click + pageview
autocapture (`lib/analytics.ts::initAutocapture`, mounted via `AnalyticsProvider` in the
layout). Captures element metadata only — never input values. The admin analytics endpoint now
also returns `event_counts`, `top_pages`, and `top_clicks`.

### 🟡 Robustness / correctness
- **`apply_strix_patches.py` silent failures** → removed by the §4 rebuild.
- **Strix scans can hang for hours** (issue #725) → hard wall-clock timeout in the adapter.
- **`validate_target_url` SSRF check is request-time only** (TOCTOU; not re-checked when Strix
  connects, no redirect-follow protection). Acceptable for the product's nature but document
  the residual risk; consider re-resolving at scan start.
- **Self-scan returns a faked "Clean" report** for `nullscan.io` — intentional, but undocumented
  and easy to mistake for a real result. Add a code comment + doc note.

### 🟢 Hygiene
- ✅ **Design doc** reconciled to the four-tier model (`NULLSCAN_DESIGN_DOC.md`).
- ✅ **`backend/.env.example`** rewritten to match `config.py` (was referencing
  `STRIX_LLM_QUICK` / `STRIX_LLM_DEEP` vars the code never reads).
- ✅ **Deprecated FastAPI `@app.on_event`** → lifespan handler (`main.py`).
- **`.claude/settings.local.json` is git-tracked** despite `.claude/` in `.gitignore`. Decide
  whether to `git rm --cached` it (contains local permission prefs).
- **Local cruft** (`nul`, `argus.db` (0 bytes), `check_*/debug_*/fix_*/reset_*/monitor_*.py`,
  `strix_test*/`) — all gitignored, not committed, but clutters the working tree. Safe to delete
  locally. `argus.db` suggests an old project name ("Argus").
- **Requirements pinning.** `requirements.txt` doesn't list `strix-agent` at all (installed via
  pipx) and `openai` is imported by `report_processor.py` but not pinned. Add both, pin
  `strix-agent==1.0.4`.
- **Email brand inconsistency** — some templates use blue `#2563eb`, others the cyan brand.

---

## 6. Open decisions (need product/eng sign-off)

1. Approve the **headless-CLI + SARIF** rebuild (§4) vs. the in-process v1.0 API alternative?
2. Default scanning model: **`gpt-5.6-terra`** (recommended) — and Sol for Deep tier? Flex tier?
3. Do we pursue a **cheaper open-weight quick tier** later, and if so, are we willing to stand
   up a Western-hosted inference boundary for compliance?
4. Fix the payment reconciliation now (independent of the rebuild — recommend yes, it's revenue).
