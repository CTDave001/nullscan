# Strix cutover runbook — activating the headless-CLI adapter

**Branch:** `strix-cutover`
**Goal:** move production off the fragile in-process Strix integration (pinned `0.7.0`) onto the
supported headless-CLI adapter (`strix-agent==1.1.0`), which is durable against future Strix
releases. Do this **deliberately, with rollback ready** — it changes how every scan runs.

## What this branch changes vs. `main`
- `backend/Dockerfile`: pin `strix-agent==0.7.0` → `==1.1.0`.
- That's it in code. The adapter itself (`app/strix_adapter.py`) already shipped to `main`
  behind the `strix_use_cli` flag (default off). This branch + the env vars below turn it on.

## Prerequisite — the one unvalidated variable
The adapter runs Strix's Docker sandbox, image **`ghcr.io/usestrix/strix-sandbox:1.0.0` (~11GB)**.
Your runtime already runs Docker (past scans prove it), but confirm the host can **pull and store
an 11GB image** (disk quota + first-pull time). This was validated on local Docker, **not** on
Railway. If the platform can't hold the image, the cutover will fail at `pull_docker_image` — so
verify disk headroom first, or pre-pull the image on the host.

## Deploy steps
1. Set environment variables (Railway → backend service → Variables):
   - `STRIX_USE_CLI=true`
   - `STRIX_LLM=openai/gpt-5.6-terra`  (or `openai/gpt-5.4` — a Strix-recommended default; use
     `openai/gpt-5.6-sol` for the deep tier if you wire per-tier models)
   - keep `LLM_API_KEY` as-is
2. Deploy this branch to backend (merge `strix-cutover` → `main`, or point the service at it).
   The Dockerfile change busts the cache → fresh `strix-agent==1.1.0` install.
3. **Watch the first deploy's logs** for the `strix-sandbox:1.0.0` pull. First run pulls ~11GB.

## Validate immediately (do NOT walk away)
1. Run **one real scan** from the UI on a target you own.
2. Watch it reach `completed` (or `failed` honestly — not stuck).
3. Confirm the result has a real report / findings, and `run.json`/`vulnerabilities.json` were
   produced. Cost should track (the adapter polls `run.json.llm_usage` and enforces the tier cost
   limit + wall-clock ceiling by killing the process).
4. Check the scan dashboard: the new scan should show cost + duration, not an instant 0-tool fail.

## Rollback (one step, fast)
If the scan hangs, fails at the image pull, or produces nothing:
- Revert the pin: set the Dockerfile back to `strix-agent==0.7.0` **and** set `STRIX_USE_CLI=false`
  (or redeploy `main`, which is still the working 0.7.0 stopgap). Prod returns to the known-good
  in-process path immediately.

## After it's validated (cleanup, separate PR)
- Delete `backend/apply_strix_patches.py` (the monkey-patches; unused on 1.1.0).
- Delete the in-process branch of `run_strix_scan_async` in `strix_runner.py` (everything after the
  `settings.strix_use_cli` dispatch) plus the ~5-layer finding-recovery scaffolding.
- Optionally add the `strix.log` progress-tailing to restore the live agent list in the scan UI.

## Why bother (the payoff)
The `0.7.0` pin fixes today's failures by freezing the version, but you're then stuck on an old
Strix and any future manual bump re-breaks the in-process API. The CLI adapter depends only on
Strix's supported surface — verified to absorb `1.0.4 → 1.1.0` with zero code changes — so
upgrades stop being landmines.
