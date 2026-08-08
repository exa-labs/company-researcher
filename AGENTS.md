
# EXA

Read this whole file before every task.

Never comment `/trunk merge` (or any other merge-queue command) on a PR unless a human explicitly tells you to. Merging is the human's call — green CI is not permission to merge.

exa is a neural, embeddings-based search engine company. This monorepo contains everything.

## Code navigation (code-nav)

Choose the tool by question shape. `agent-scripts/code-nav` answers structural symbol and flow questions from a pre-built AST code graph (CodeGraph engine); grep answers literal-text and repo-wide discovery questions:

```
agent-scripts/code-nav def <symbol> --scope <project-dir>       # definitions: file:line + signature
agent-scripts/code-nav node <symbol> --scope <project-dir>      # one symbol's full source + caller/callee trail
agent-scripts/code-nav callers|callees|impact <symbol> --scope <project-dir>
agent-scripts/code-nav explore "<exact symbols/files; terse keywords for discovery>" --scope <project-dir>  # multi-symbol source + call paths
agent-scripts/code-nav def <symbol> --scope auto                # search all already-indexed projects
agent-scripts/code-nav affected <changed-file...> --scope <project-dir>  # which test files to run
```

Rules of thumb:
- **One known symbol → `def`/`node`/`callers`/`callees`/`impact`.** Use the command matching the requested fact instead of `explore` or grep.
- **A multi-symbol flow or unfamiliar subsystem → `explore`.** Use it when it replaces multiple searches and reads. Start with a compact identifier-first query, not the user's conversational sentence: when names are known, provide 2–8 exact symbols, qualified names, or file paths plus at most 3 distinctive domain terms; qualify overloaded names with their class, module, or file. When names are unknown, start with 3–6 terse domain keywords, then make a focused query with exact identifiers returned by discovery. Omit prompt filler such as “show me,” “how does,” “where,” “happen,” and “interact.”
- **An exact string or non-code value → grep.** Use grep for config keys, flags, error text, wire fields, docs, and data; code-nav adds no structural value.
- **A repo-wide consumer search or absence claim → grep.** code-nav only sees the queried project, and `--scope auto` only searches already-indexed projects.
- Stop when the returned source and call paths answer the question. Follow up only for a specific omitted symbol or file; use `node` when one symbol's full body is all that is missing.
- Treat returned verbatim source as already read — do not re-read those files or re-verify with grep. Structural edges (callers/callees/impact) are best-effort name resolution: ambiguous calls may list multiple candidates, and the compiler/tests remain the correctness authority.
- Results are **within the queried scope only**: `impact`/`callers` on a shared package (e.g. exa-deploy) won't see consumers in sibling projects, and `affected` is not complete test selection for shared code — use `--scope auto`, grep, or CI for cross-project blast radius and absence claims.
- Queries auto-sync the index when the working tree changed, so results track your in-session edits. If code-nav prints a sync-failure warning, verify with read/grep.
- Invoke it as `agent-scripts/code-nav` from the repo root, or by absolute path — it is not on PATH and there is no `.agents/bin/code-nav`.
- Scope is a project subtree (nearest package.json/pyproject.toml/go.mod/Cargo.toml). Manifest-less trees (most of `infra/`, `kubernetes/`, `ansible/`, and top-level `go/cortex`) are not scope-able; a bad-scope error lists valid nested scopes, or use grep. On Devin VMs, graphs for exa-deploy, exa-shared, kronos, vulcan, aethon, and atlas are pre-built at snapshot time; elsewhere (local Codex, Claude Code) the pinned engine installs itself on first use and each scope indexes on first query (typically <10s per project). Indexed languages include TS/TSX, JS, Python, Go, Rust, Java, C/C++, Nix, Terraform.
- Fall back to raw grep/read when code-nav finds nothing.

## Glossary

atlas - distributed vector database and retrieval system. Jata - custom columnar storage engine underneath. 
sierra sits in front, orchestrating Atlas and the query embedding server over gRPC.

vulcan - API gateway. 
- powers `/search`, `/contents`, `/findsimilar`
- routes into Kronos
- VQL — "Vulcan Query Language" — DAG execution graph built for each request

kronos - backend for our agentic products. "Kronos" alone is ambiguous — it hosts several distinct products, so figure out which one a prompt means before doing anything:
- **Kronos (websets)** — the Websets product (`src/webset/`, public API under `src/api/v0/websets/`). You give a query, it breaks it into criteria, fans out searches, grades results against the criteria, and lets you enrich rows by searching the web again. Websets API is the same thing, exposed to developers.
- **Kronos (agents)** — the Exa Agents product behind `/agent/runs` (`src/agent/`: `v0`/`v1` API layers plus `harnesses/` with coordinator/subagent loops). Not websets — different code paths, tests, and debugging flows.
- **Kronos (answer/research)** — `/answer` (`src/answer/`) and `/research` (`src/research/`).
- If a prompt just says "kronos", disambiguate from context (file paths, endpoints, product words like "items/enrichments" → websets vs "runs/coordinator/subagent" → agents) before assuming websets.

apollo is our contents service 
- does extraction
- livecrawl does real-time pulls for fresh results.

crawling (livecrawl and background) is lots of microservices. 

silk node ("Silk Road") - streaming crawl→embedding→index pipeline that replaces the batch Databricks embedding job. A Kafka(WarpStream)-driven graph of nodes runs Polars / `exa-polars` transforms over batches, embeds with exa3 on AWS Neuron, dedups via ScyllaDB simhash state, and writes Lance datasets on S3 (`atlas.lance` / `cosmos.lance`) that Atlas serves. Runs on its own `silk-road-cluster-{staging,production}` EKS clusters. Code in `python/services/silk_node`; team/Linear key is `SILK`.

Exa_ML is the Python monorepo where we train. 

> **DEPRECATED:** `python/shared/legacy_examl_dontlook` (formerly `exa_ml`) is deprecated. Do not use it for new training, evaluation, or inference work. Its implicit NFS usage is broadly broken; `cache_s3` has race conditions, can corrupt data, and is wrong for inputs such as paths ending in `/`; and distributed-training paths contain multiple deadlocks. Use the isolated `python/training` projects instead, with per-project vendored training code and isolated dependencies. This legacy tree remains only because live production consumers (`python/services/embed` and `python/rolly/index_reconciler`) still import `tectonic.trainable_model` / `tectonic.types`; its minimal production inference/model surface will be extracted into a proper shared project later.
- tectonic - the contrastive-pretraining engine
- crucible - eval framework
- Frodo - full-index distillation
- minos2 - universal eval harness for search/RAG. 

vibechecker is synthetic prod monitoring.

billing runs through Orb and Stripe and is spread across the billing-reconciler service (backend, webhooks, rate limits) and the dashboard (frontend payments, usage visualization).

Clusters: olympus-staging is where tilt and preview deploys land and where the service train passes through. olympus-production is the legacy production cluster while the main-cluster migration is in progress. **main-cluster-production runs in parallel during this migration** — a Pulumi-managed EKS cluster (envoy gateway + `HTTPRoute`, IPv4, K8s 1.35) intended to replace olympus as traffic is shifted over gradually, and it can receive any traffic currently routed by the migration ALB; `main-cluster-staging` is the parallel staging stack. olympus services define ingress under `kubernetes/<svc>/<env>/ingress.yaml` (Flux + `Ingress`); main-cluster services define ingress in their `deploy.ts` (Pulumi + `HTTPRoute`). **Production ingress is transitional dual state while traffic is being slowly shifted**: `api.exa.ai` / `api.exa.sh` and most ingress hostnames are Cloudflare-proxied → `k8s-ingressn-*` NLB → `olympus-migration-alb` ALB. The ALB has per-host-header listener rules; each rule forwards to a target group pointing at olympus ingress-nginx or main-cluster's envoy gateway — so any host can move to main-cluster without a DNS change. The public API host rules already forward directly to main-cluster. The ALB terminates client TLS with ACM certs (validated via Cloudflare CNAMEs) and re-encrypts on the backend hop. **The migration ALB and its per-host rules will be torn down once everything has moved to main-cluster** — don't bake long-term assumptions on the current rule shape. **SRE / oncall:** for "where does host X land today?", the ALB listener rules are the live source of truth — `aws elbv2 describe-rules` against the `olympus-migration-alb` :443 listener prints every host header → target group mapping. Target group names tell you the cluster: `olympus-mig-ingress-*` → olympus ingress-nginx, `olympus-mig-mc-gateway` → main-cluster envoy. Rule definitions live in `infra/core/edge-alb/deploy.ts`. If a service "works on olympus but fails at api.exa.ai," suspect this hop (rule, target group health, backend TLS) before the cluster itself. See `infra/core/main-cluster/AGENTS.md` for main-cluster internals. Hephaestus is the ML/Flyte/batch cluster. Most things live in us-west-2, a few in us-east-1. Kubernetes services deploy by pushing a git tag (e.g. `vulcan/2.1.132`); Vercel production deploys are transitional: tag-based apps use `<production_tag_prefix>/<version>` tags, while legacy branch-based apps still use `production_branch`, as defined in `.github/scripts/config/vercel_projects.py`. **Service-train exa-deploy canonical mode (vulcan + kronos):** these two run with `exa_deploy: true`, so exa-deploy is the canonical gating path: tests, locks, production gates, and staging rollback depend on `exa-deploy-{staging,production}` success. With `flux_coexist: false` (now Vulcan + Kronos too — their olympus Flux manifests under `kubernetes/{vulcan,kronos}/` have been removed), Flux build/deploy jobs are nooped. With `flux_coexist: true`, Flux/Olympus runs in decoupled `build-{staging,production}-coexist` and `flux-{staging,production}-coexist` shadow jobs while exa-deploy remains primary. All other callers with `exa_deploy: false` retain Flux-primary semantics. Full reference in `.agents/skills/deployment/SKILL.md`.

For API/Vulcan checks through the migration ALB, pin individual requests to main-cluster with `x-cluster: main-cluster` on `https://api.exa.sh` (staging) or `https://api.exa.ai` (production). `x-cluster: olympus` is intentionally blocked and returns `410`; details and curl examples live in `infra/core/edge-alb/README.md`.

## Repo shape

everything is built by nix and we heavily use direnv. consider this if a binary is missing

Every Nix project is an **exapkgs** project: a `project.nix` in the root scope, auto-discovered and built by an exalib builder, with its nixpkgs pinned in `project.lock` and a *generated* `flake.nix` stub. A handful of legacy standalone flakes remain and are being converted — don't copy them.

When editing Nix, internalize `NIX_GUARDIAN.md` before writing code. The rules that most often bite agents:
- Pin every nixpkgs or publicly readable GitHub-sourced flake input through the internal tarball cache with a full 40-character SHA: `tarball+https://tarball.internal.exa.ai/github/<owner>/<repo>/<sha>.tar.gz`. The cache's tarball route is intentionally unauthenticated, so private GitHub sources must be pinned monorepo submodules consumed through local flake inputs (`path:` or `git+file:` as appropriate), never cache allowlist entries. Do not use `github:...`, branch/tag refs, or derivations that fetch nixpkgs from GitHub at eval/build time.
- Do not add or expand raw `builtins.fetchTarball` in checked-in Nix. For `nix2container` / `n2cSrc` / `pinnedPushNixpkgs` / `pushPkgs` Docker-image plumbing, use the builders' `dockerImageSpec` outputs (`.docker`, `.push-to-ecr`, `.deploy`) instead of hand-rolled tarball builtins.
- Nix-built images lay out `/etc/passwd` as an absolute symlink into `/nix/store`, which containerd >= 2.2.0 refuses to run (`CreateContainerError: ... openat etc/passwd: path escapes from parent`, [containerd#12683](https://github.com/containerd/containerd/issues/12683)). If a service image needs `/etc/passwd`/`/etc/group` or hits that error on a cluster node, exapkgs images already handle it: `dockerImageSpec.provideFhsRoot` defaults to `true` and stages the `exalib/fhsCompat.nix` skeleton — real (dereferenced) `/etc/passwd`, `/etc/group`, and `/etc/nsswitch.conf` files instead of symlinks. Legacy flakes get the same from `flakes/lib/containerd-fhs-compat.nix`.
- Route the root flake's shared inputs through `follows` (`inputs.<dep>.inputs.nixpkgs.follows = "nixpkgs"`) instead of pulling duplicate nixpkgs graphs.
- Never pass broad local trees to a derivation (`src = ./.;`, bare `${./.}`, or hand-rolled `lib.cleanSourceWith`). The builders filter project sources through `exalib/mkFilteredSource.nix` automatically (it drops Markdown, `.nix`, `flake.*`, `project.lock`, `.direnv`, caches, `node_modules`, build outputs); narrow it with `extraSourceFilter` and re-admit build/test data with `forceSourceInclude`.
- Use the exalib builders — `makeGoProject`, `makeRustProject`, `makePythonProject`, `makeMaturinProject`, `makeNapiProject`, `makeTypescriptProject`, `makeNextProject`, `makeDevshellProject` (API reference: `exalib/AGENTS.md`). Never hand-roll derivations, check plumbing, or dev shells in a `project.nix`, and never add a new hand-written `flake.nix`; if a builder can't express something, extend the builder.
- Avoid `flake-utils`. exapkgs projects have no per-system wiring at all; the root scope handles systems.
- Pin each project's nixpkgs with `project-lock` and `pkgs = fetchNixpkgs { lockFile = ./project.lock; };` — builders throw without it. Commit the language lockfile (`gobuild-nix.lock`, `Cargo.nix`, `uv.lock`, `pnpm-lock.yaml`) and `git add` new files; builds only see tracked/staged files.
- Keep inline Bash in Nix to very small glue snippets. Put multiple functions, substantial control flow, parsing/data transformation, or multi-step orchestration in a checked-in language-specific script that Nix packages or invokes; do not move a large inline blob unchanged into a `.sh` file. A simple conditional or loop used as direct glue is fine.
- Split god derivations into independently-cacheable codegen, build, test, and image/push derivations. If a Nix-behavior claim matters, quote the official Nix manual/manpage.
- In hot eval paths or shared Nix libraries, prefer nullable attribute names (`${if cond then "name" else null} = value;`) over `// optionalAttrs`.
- Nix `strictDeps = true` rule, shortest compaction-safe form: **brand-new package/service only**. Existing packages are not required to add it, including packages modified in place, migrated to an exalib builder, or edited inside an existing builder/`stdenv.mkDerivation` call.
- Never invent output names. CI, exa-deploy, and `nixed-reusable` address the canonical set forwarded by `exalib/callFlake.nix` (`canonicalOutputs` there is the source of truth): `unitTest`, `unitTestMatrix`, `integrationTest`, `integrationTestMatrix`, `integrationTestScript`, `typecheck`, `typecheckMatrix`, `lint`, `format`, `docker`, `push-to-ecr`, `deploy`, `e2e`, `e2e-test-image`, `push-e2e-to-ecr`, `e2e-deploy`.

New project checklist and builder API: `exalib/AGENTS.md`, background in `NIX.md`. Convert a remaining standalone flake with `.agents/skills/exapkgs-convert-flake/SKILL.md`.

deployments are currently in two modes. 
- The legacy path — which is still some of prod — is Flux-managed Kubernetes YAML under `kubernetes/` plus Terraform modules under `terraform/global/` and `terraform/regions/`. - -
- The new path for new services or apps, including public apps, is **exa-deploy**. If you're editing something that already exists in Flux/Terraform, stay in Flux/Terraform.
- Nothing new should be put in `node/`. It's a legacy subrepo path.

### Karpenter fork deployment status

`go/kraftsman-ko` contains Exa's Karpenter fork as two submodules: `base` (`sigs.k8s.io/karpenter`) and `aws-provider` (the AWS provider). Its workflow builds a controller image to ECR, but **nothing deploys that image**. All exa-deploy clusters run upstream Karpenter from the public Helm chart `oci://public.ecr.aws/karpenter/karpenter`, configured in `typescript/shared/exa-deploy/framework/src/std/kubernetes/scheduling/karpenter.ts`, with no controller image override. Whether a monorepo module uses the fork is determined by `replace` directives: `infra/exa-scale` uses the fork through its sibling `infra/kraftsman` project, while the standalone ko path continues to use `go/kraftsman-ko/base`. Do not infer from the existence of `go/kraftsman-ko` that the fork runs in production.

Cluster access scripts are `./agent-scripts/clusters/{staging,prod,main-staging,main-prod,atlas-staging,atlas-prod}` for olympus/main-cluster/atlas-cluster; hephaestus uses `bin/exa-load-hephaestus-cluster-shell.sh [readonly]` (pulls kubeconfig from 1Password). **Unless you are Devin, do not run these scripts — or `agent-scripts/oncall/prod` or `agent-scripts/minikube-for-tilt` — because they mutate the user's default kubeconfig. Pass `--context <ctx>` to kubectl directly instead.** Standard contexts: `olympus-production`, `olympus-staging`, `main-cluster-production`, `main-cluster-staging`, `atlas-cluster-production`, `atlas-cluster-staging`. If a needed context isn't in the user's kubeconfig, ask the user to run the appropriate `clusters/*` script themselves.

**EKS breakglass works for agents — you do not need a human to run it for you.** `./agent-scripts/request-permissions.py breakglass-k8s <cluster> --reason "…" --wait` requests a 1-hour cluster-admin EKS access entry for your own identity on any EKS cluster in the account (including atlas, crawling, silk-road, unsafe-crawling, olympus, and main-cluster). It authenticates with your ambient AWS identity, posts an approval link to the requesting Slack thread, and audit-logs every grant to the security channel; a human approves through SSO. After approval, `aws eks update-kubeconfig --name <cluster> --region us-west-2` (no `--role-arn` for the agent IAM user) and use kubectl as cluster-admin. Gaia/CAPI clusters and Hephaestus are not EKS and cannot use this flow: for Gaia use the `<cluster>/agent-kubeconfig` secret / `mkGaiaAgentAccess` read-only path, for CoreWeave use the request-permissions-gated `coreweave-production/agent-kubeconfig` secret (see the CoreWeave clause below), and for Hephaestus use `bin/exa-load-hephaestus-cluster-shell.sh`. **This is for genuine emergencies only** — an active incident where no lower-privilege path works — and you must get explicit confirmation from the session owner before submitting, since approval pages a human for cluster-admin. For anything routine (logs, verification, poking at prod), request scoped read-only permissions instead. Full policy: `.agents/skills/request-permissions/SKILL.md`.

**Gaia clusters (Delphi, `silk-road-cluster-gaia`) — background agents already have dedicated read-only access; do NOT `request-permissions` / assume a `*-kubernetes-viewer` role.** These stacks (`mkGaiaAgentAccess`) map the `devin-background-agent` IAM user straight into the `agents-production` Kubernetes group and publish a self-authenticating kubeconfig to AWS Secrets Manager at `<cluster>/agent-kubeconfig` (e.g. `delphi-production/agent-kubeconfig`). Use it directly — the agent authenticates as itself, no role assumption: `aws secretsmanager get-secret-value --secret-id delphi-production/agent-kubeconfig --query SecretString --output text > /tmp/kc.json && KUBECONFIG=/tmp/kc.json kubectl get nodes` (the kubeconfig execs `aws-iam-authenticator token -i <cluster>`, which lives in the nix store; add its `bin` to PATH). Never overwrite the user's default kubeconfig and never commit the kubeconfig. The generic `<cluster>-kubernetes-viewer` IAM role is the all-employees path (plain `gaia:view`, no nodes/karpenter/monitoring) and the agent baseline intentionally does not grant `sts:AssumeRole` on it — the `agents-production` kubeconfig is dedicated and strictly broader. To change what the agents can read, edit the `mkGaiaAgentAccess(...)` call in the cluster's `infra/core/<cluster>/deploy.ts` (`extraClusterCapabilities` / `extraNamespacedCapabilities`; helper in `typescript/shared/exa-deploy/framework/src/std/kubernetes/gaia/agent-access.ts`); grants are declarative and apply only after the Pulumi stack is deployed, must stay read-only (`get/list/watch`) — the sole exception is a workload stack declaring its own narrowly-scoped, `resourceNames`-pinned write Role in a namespace it owns (e.g. pythia's AutoMQ pod-delete in `infra/pythia/deploy.ts`), never a namespace-wide or cluster-wide write here — and must keep cluster-wide core-group **Secret** reads out (Secrets hold live prod credentials) — scope any Secret read to the specific namespace that needs it (e.g. `monitoring` for Mimir/Grafana).

**CoreWeave POC cluster (`usw4a_US-WEST-04A`, flyte + overseer) — read-only agent access exists but is NOT standing access.** Unlike Gaia there is no IAM auth path on CKS, so `infra/core/coreweave/agent-access.ts` publishes a kubeconfig containing a **live read-only bearer token** to AWS Secrets Manager at `coreweave-production/agent-kubeconfig`. The baseline agent role deliberately cannot read it: request `secretsmanager:GetSecretValue` scoped to exactly `arn:aws:secretsmanager:us-west-2:472386928882:secret:coreweave-production/agent-kubeconfig-*` plus `kms:Decrypt` on the secret's CMK (`alias/coreweave/production`, key `arn:aws:kms:us-west-2:472386928882:key/faf9085a-cfbc-4781-b8ae-6e3f00ee7628`) via `./agent-scripts/request-permissions.py request <name> <policy.json> --wait` (a human approves), then `aws secretsmanager get-secret-value --secret-id coreweave-production/agent-kubeconfig --query SecretString --output text > /tmp/cw-agent-kc.yaml && KUBECONFIG=/tmp/cw-agent-kc.yaml kubectl get pods -A`. The token is scoped to the built-in `view` ClusterRole plus node reads (no Secret reads). Because it is a real credential, never print, commit, or leave the kubeconfig outside `/tmp`, and delete it when done.

**Agents: tag every ad hoc staging namespace for garbage collection.** A ValidatingAdmissionPolicy on olympus-staging and main-cluster-staging (`require-agent-namespace-gc-labels`) rejects namespace creation by agent identities unless the CREATE request already carries `exa.ai/creator-kind=agent` + `exa.ai/agent=<agent>` plus either `exa.ai/managed-by=tilt` (the `tilt` wrapper does all of this automatically) or the GC opt-in `exa.ai/gc=true`. So if you create a staging namespace outside the `tilt` wrapper, create it with the labels included — `kubectl create namespace` alone will be denied:
```
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: <ns>
  labels:
    exa.ai/gc: "true"
    exa.ai/creator-kind: agent
    exa.ai/agent: <agent, e.g. devin|codex|capy>
  annotations:
    exa.ai/git-author: <email>
    exa.ai/tilt-session-id: <session-id>
    exa.ai/slack-channel: <channel id of the requesting Slack thread, if known>
    exa.ai/slack-thread: <thread ts of the requesting Slack thread, if known>
EOF
```
`exa.ai/gc=true` namespaces are TTL-reaped after 48h by the agent-dev-cleanup reaper (infra/automations/agent-dev-cleanup), which posts a pre-expiry warning ~12h before deletion — into the Slack thread from the `exa.ai/slack-channel`/`exa.ai/slack-thread` annotations when present, else as a DM to the `exa.ai/git-author`. If a workload needs longer, extend its life with `kubectl label ns <ns> exa.ai/gc-ttl=14d --overwrite` (`<n>h`/`<n>d` accepted, capped at 14d per extension, measured from when the reaper next sees the new value). Extensions are repeatable — re-label with a *different* value to extend again — but there is no permanent exemption: anything that must outlive repeated 14d extensions should be deployed properly (exa-deploy), not as an ad hoc namespace.

## How we write code

### Python
`uv` for everything. Never `pip`. 
run scripts with `uv run script.py` or `./script.py`, never `python script.py`. 

Imports are always put at the top of the file, just after any module comments and docstrings, and before module globals and constants. Enforced by ruff `E402`; the only exemptions (see `ruff.toml`) are files where code must run before the import (notebook cells, `sys.path`/env/stdout setup, native-lib preloads, tracing or monkey-patch hooks, circular-import or `try`/`except` availability imports).

### Rust

Add deps with `cargo add`, not by hand. 

Never run bare `cargo fmt` or `rustfmt`. The repo formats with a pinned *nightly* rustfmt (`rustfmtNightlyVersion` in `rust/flake.nix`) and unstable `.rustfmt.toml` options; the rustup toolchain on most agent PATHs is stable, which silently ignores those options and reformats the entire repo with the wrong style. Format Rust only through `bin/format --fix` (it builds and runs the pinned nightly). If you already misformatted files, revert non-destructively — `git diff -- . ':(exclude)path/keep.rs' | git apply -R` — then re-run `bin/format --fix` on what you kept.

### GitHub Actions
**workflow-gen** is the canonical way to add Actions. Read `rust/scripts/workflow-gen/SPEC.md` and `tests/e2e.rs` first. We try to keep logic out of YAML by wrapping `nixed-reusable` — a flake directory and a script. Use job summaries to leave concise per-step and final status.

Before doing replacement, wrapper, or maintenance work for an action/workflow, first prove the action is actually useful. Check whether the workflow is active, when it last ran, what events/paths trigger it, whether those triggers still match live code, whether downstream jobs or humans consume its outputs/artifacts/statuses, and whether the action step's outputs are used. If the workflow/action is dead, redundant, or its outputs are unused, prefer deleting or simplifying it over creating a new wrapper around dead CI.

## The commandments

Correctness and autonomy over speed or cost. Take the time to do it right.

Go deeper — don't ask, just do it. When a thought bubble says "should I check X?" or "should I dig further?", the answer is always yes. Don't stop to ask the human; read more code, chase the root cause, finish.

Understand before you edit. Build complete context — the file, its imports, callers, tests, and siblings — before changing it. Source returned by a code-graph tool (e.g. code-nav) counts as read; open full files for whatever the graph didn't return. We do not care how long this takes.

Do not suppress errors. Treat recurring errors as evidence to understand, not noise to quiet. The default behavior for errors is to fail through to the most general handler possible: fail the request, preserve Sentry/logging, and keep the signal visible. Before catching errors, adding fallbacks, handling special cases, or otherwise reducing error visibility, first prove whether the root cause is fixable. If compensating for the error is still necessary, justify that the product/system improvement outweighs the lost visibility and reclaim visibility with a metric, log, alert, or equivalent signal. If the root cause cannot be fixed because it is outside our control, leave a comment explaining the error and why it is WONTFIX.

That said, don't expand scope on your own. Do what was asked, deeply. Don't randomly refactor neighboring code, rename things, or reformat unrelated files.

Write code for clarity, write messages for brevity. Verbose code is fine; verbose Slack is not.

Prefer stating claims directly over hedging with filler like "honestly" or "to be honest" — every statement is expected to be true already, so the qualifier adds nothing. This applies everywhere you write: Slack, PR descriptions, comments, commits, docs, code.

Write beautiful code. Someone should look at it and say "the muses have touched their soul." Pure, testable functions composed by less-pure ones. Classes when the domain warrants them. Composition over inheritance. 

Docstrings on every non-trivial function — "non-trivial" meaning the name and signature don't already tell you what it does. 

Make plenty use of file headers for maintaining coherence over time and an high signal overview of contents

No new markdown files unless explicitly requested

Test through blessed APIs — `exa-curl`, `run-sdk-tests`, our e2e infra and other APIs/CLIs. No UI or browser automation unless the human asks.

Never trust an SDK's types as the source of truth for what a third-party API can do. Vendored SDK type definitions lag behind the real API (Orb's SDK has burned us this way more than once — e.g. its `SubscriptionListParams` omits the `plan_id`/`external_plan_id` filters the API supports). For ANY code task that touches a third-party API, check BOTH the provider's public API docs AND the SDK code/types before concluding a capability exists or is missing — and if the docs and the SDK disagree, verify against the live API (a cheap read-only call) and believe the API, passing the undeclared params through with a narrow type assertion.

## When you need a tool

Capability order: check `agent-scripts/` and repo docs first, then `mcp-svc` (see below), then external CLIs (`gh`, Slack APIs), then ask a human for credentials. **Prefer `mcp-svc` for anything an MCP server it fronts can do** — instead of holding an upstream API key, running an OAuth flow, driving a browser login, or telling a human you can't reach a service. The fronted set is broad and growing (currently Exa search, Gmail, Google Calendar, Gong recordings/transcripts, Linear (on Devin, use the builtin `linear` tool instead), Slack — both as-automation `slack` and as-the-user `slack-personal` — Notion, Salesforce, Pylon, Amplemarket, Centralize, and **Upside**) — so **do not assume a third-party SaaS is out of reach: run `mcp-svc servers` to see the live list before you open a browser or ask for a login.** If you hit a login wall, SSO screen, or password prompt for a SaaS product (Upside, Salesforce, Notion, …), that is your signal to stop and check `mcp-svc servers` — reaching for browser automation or requesting a credential is the wrong move when the proxy already fronts it. **Your host agent's own native MCP integrations / marketplace list (e.g. Devin's `mcp_tool`/`list_servers`) is NOT the same as `mcp-svc` and does not include Gong** — never conclude a service like Gong "isn't connected" from that list; check `mcp-svc servers` first. When a task needs a user's email or calendar (e.g. "find the forwarded email titled X", "what's on my calendar"), go straight to `mcp-svc`. If the task is "upload a markdown report," grep `agent-scripts/` for "upload" — you'll find `upload-content.sh` — instead of reaching for the Slack API. Before using a tool for the first time, read its source; if there's a `--help`, read that too.

One-liners. Run with `--help` for the full story.

- `bin/agent-task` — unified launcher for common workflows (api probes, clickhouse, CI logs, uploads, slack, deploys). Try this before assembling chains by hand.
- `exa-curl` — HTTP/gRPC client for Exa endpoints. Use this for any API probing.
- `exa-websets` — websets creation, debugging, monitoring.
- `run-sdk-tests <env> [tests|-s]` — SDK tests against any environment.
- `query_clickhouse.py --service <svc> --query …` — authoritative ClickHouse access. Do not use the ClickHouse MCP.
- `databricks-query` — Databricks queries. Dev is read/write, `--env prod` is read-only. Never use the raw `databricks` CLI.
- `agent-scripts/prod-db-ro [-c "SELECT …"]` — read-only psql against the production `metaphor` dashboard Postgres (connects as `exa_clanker` via the `dashboard-production-ro` secret; baseline agent creds, no `request-permissions`). Use this for prod DB reads — the `DATABASE_URL_RO`/`POSTGRES_READ_URL` env vars point at staging / a stale `exa_user`, not prod.
- `agent-scripts/monitor-ci [--pr N | --run ID] [--self] [--wait] [--failures] [--parse-failures]` — unified CI monitor. Default to `--self` (register-and-exit: server-side watch wakes the session when CI finishes — end your turn); use `--wait` only when the result gates work you'll do immediately in the same turn. Never re-run `gh run view` / `gh pr checks`, and use `--parse-failures` instead of `gh run view --log-failed`.
- `parse-ci-logs.py <job_id>` — pull signal out of noisy kronos/jest logs.
- `agent-scripts/k8s-watch --self <kind>/<name> [-n NS] [--context CTX] [--timeout SECS]` — register-and-exit waits for Kubernetes rollouts, jobs, and pods (deployment/statefulset/daemonset/job/pod). A detached watcher blocks on kubectl and wakes the session at the terminal state — never hold `kubectl rollout status` open or poll `kubectl get` yourself; use `--wait` only when the result gates same-turn work.
- `agent-scripts/proc-watch --self [--pid PID | -- <cmd…>] [--log FILE] [--timeout SECS]` — register-and-exit waits for local background processes: wakes the session with the exit status and log tail when the process exits. Prefer remote execution (`overseer launch`/`overseer iterate`) for long jobs, but if a job must run locally, never tail it or poll `ps` — register a proc watch and end your turn. This includes foreground Modal clients: `proc-watch --self --log /tmp/job.log -- modal run script.py` instead of blocking on `modal run` or sleep-and-grep loops on its log.
- `agent-scripts/modal-watch --self <ap-…> [--env ENV] [--timeout SECS]` — register-and-exit waits for detached Modal apps (`modal run --detach`): a detached watcher polls the Modal CLI and wakes the session with the final state and log tail when the app stops — never poll `modal app list` / `modal app logs` yourself; use `--wait` only when the result gates same-turn work.
- `ignore-tests` — temporarily skip tests with a TTL only after recording the full required justification schema (reason, investigation, category, suspected cause, evidence URL, and requester). Always `list` before `store`. `--this-is-an-emergency-production-hotfix` is exclusively for unblocking a production hotfix, never routine ignores.
- `bin/tilt.sh ci -- <svc>` (non-interactive) / `bin/tilt.sh up -- <svc>` (streams logs). "Ready" pods ≠ built service; builds happen inside the pods, read the logs.
- `deploy-svc.sh <svc> [-s calver|patch|minor|major]` — tag a service and trigger the train.
- `workflow-trigger.sh <workflow> <branch> [inputs-json]` — trigger GHA workflows; `--rerun-failed <run-id>` reruns failed jobs.
- `request-tf-apply <tf-dir> [plan|full]` — human-approved terraform apply for the current branch.
- `request-permissions.py {list|assume <name>|assume baseline|request <role> <file>}` — scoped, temporary IAM roles. When you hit AccessDenied, write the needed IAM policy to a JSON file and `request-permissions.py request <name> <file> --wait`; a human approves via the URL it prints, then the role is ready to assume. `breakglass-k8s <cluster>` is the emergency-only path to 1-hour EKS cluster-admin (see the cluster-access section above). **Reading a Lance dataset on S3 (`atlas.lance` / `cosmos.lance`, aletheia artifacts) always needs `s3:GetObject` on both the dataset prefix and the wildcard behind it** — `arn:aws:s3:::<bucket>/<prefix>` *and* `arn:aws:s3:::<bucket>/<prefix>/*` — plus `s3:ListBucket` on the bucket ARN (bucket-level action; on a key ARN it grants nothing). Lance lists the dataset directory before reading the manifests and fragments underneath it, so a policy missing any of these fails partway through the read rather than at open time. The script is not on `PATH` — invoke it as `./agent-scripts/request-permissions.py` from the repo root.
- `one-time-secret {send|receive|request}` — AES-GCM self-destructing secrets. Always redirect to a file (`> /tmp/x`) so the value never hits your token stream.
- `upload-content.sh <file> [name]` — upload markdown/HTML/images/videos, get a shareable URL.
- Grafana:
  - Human-style browsing: `https://grafana.exa.ai` is Google/OIDC SSO-gated; use Interactive Browser + `devin@exa.ai` only when you need to look around manually.
  - Querying metrics: use `grafana_query.py "<promql>" --cluster mc`, not browser OAuth cookies. It talks to Grafana's `/api/ds/query` through a port-forwarded Grafana, prints a bounded summary by default, and supports `--output frames|full` when you need JSON.
  - Temp dashboards: use `grafana_dashboard.py <json>` or `grafana_panel.py "<promql>"`. Run temp dashboards directly; don't open a PR just to create one. Use `grafana_dashboard.py --validate-panels` to execute dashboard panel queries through Grafana before saving. Pass `--crd` (mc only) to deliver the board as a grafana-operator `GrafanaDashboard` CR (applied with kubectl) instead of the HTTP API — same UID/URL, reconciled by the operator.
  - The default and canonical cluster is `mc` (main-cluster-production, public URL `https://grafana.exa.ai`); the legacy olympus Grafana instance is deprecated and is no longer a target. `grafana_query.py` / `grafana_dashboard.py` also accept `--cluster heph` (hephaestus). The scripts port-forward to the cluster Grafana and authenticate via admin credentials / in-cluster secrets, so public SSO does not block agents. `--cluster mc` needs the `main-cluster-production` context (`./agent-scripts/clusters/main-prod`).
- `open-trace-analyzer` (aka otel-trace-viz) — OTEL trace visualization and latency diffs.
- `vantage_report.py "Title" [--filter …] [--groupings …]` — cloud cost reports.
- `wandb.py {runs|run|status|compare} <project>` — browse W&B runs. Needs `WANDB_API_KEY`.
- `modal` — deploys ML inference (QES, vLLM, rerankers). Never run `modal deploy`, `modal app deploy`, or `uv run modal deploy` without explicit human permission. NEVER deploy onto the Modal `main` environment — always target the `staging` environment (`--env staging`). Any Modal workload you create or modify MUST set `min_containers=0` unless the human has made a strict request for warm containers.
- `agnts` — one local terminal client for cloud coding agents (Devin / Cursor / Capy / Heron / Aethon / Goblin), routed through the agents-svc GraphQL backend via your AWS STS identity: `ls`/`new`/`show`/`msg`/`attach`/`tail`/`wait`/`open`/`threads`. Pin a provider with `-p <provider>`.
- `mcp-svc {servers|tools <server>|call <server> <tool> [json]|whoami}` — keyless proxy to MCP-only services. **This is the first thing to reach for when a task touches a third-party SaaS** — see the dedicated `## mcp-svc` section below and `.agents/skills/mcp-svc/SKILL.md`.
- `charon-mint-key.py --purpose <slug> --monthly-limit <usd> [-o <file>]` — when a workload needs LLM calls and you need an API key, mint your OWN short-lived, purpose-tagged Charon key via your AWS STS identity instead of reusing a shared/default key. **Never reuse a shared `*-training` key, a personal key copy-pasted into the env, or an ambient high-limit `CHARON_API_KEY`** — that's how one job silently spent $100k with no attribution. Every minted key is TTL-bounded, spend-capped, and tagged so the spend maps back to your run; spend also rolls up against your identity's aggregate cap. See `.agents/skills/charon-mint-key/SKILL.md` and `infra/charon/AGENTS.md`.

## mcp-svc

`mcp-svc` is Exa's single identity backbone in front of MCP-only and SaaS services. **If you need to do something that touches a third-party service, check `mcp-svc` first** — before opening a browser, scripting a login, holding an upstream API key, or asking a human for credentials. Wrapper at `infra/tools/agnts/mcp-svc/mcp-svc`; deep reference in `.agents/skills/mcp-svc/SKILL.md`.

How it works: no keys or tokens are passed on the command line. The CLI signs a presigned AWS STS `GetCallerIdentity` request with your ambient AWS credentials and sends it as a bearer token; the proxy replays it against STS, derives the session owner's Exa email from the caller ARN, looks up the upstream credential registered for that user (none / shared key / personal key / OAuth grant), and injects it before forwarding. Run `mcp-svc whoami` to confirm which identity (and thus whose credentials) the proxy resolves for you.

```bash
mcp-svc servers                          # list registered MCP servers (live source of truth)
mcp-svc tools  <server>                  # list a server's tools with schemas
mcp-svc call   <server> <tool> [json]    # call a tool (args default to {})
mcp-svc whoami                           # identity the proxy sees
```

Fronted servers (run `mcp-svc servers` for the live list — it grows):

- `exa` — Exa hosted search (shared key, works with no grant).
- `gmail` — the session owner's mail: search, read, send/draft/label (per-caller OAuth).
- `google_calendar` — the session owner's calendars and events, incl. create/update/RSVP (per-caller OAuth).
- `gong` — read-only external/customer call recordings and transcripts (shared company grant, no per-user auth). Internal meetings live in Fireflies; through 2026-08-13 check both.
- `linear` — Linear issues/projects via the user's personal API key held by the proxy. **On Devin, use the builtin `linear` tool instead of `mcp-svc call linear`.**
- `slack` — Slack messaging MCP posting via the **Devin/agent automation identity**. Use only when a message should visibly come from automation.
- `slack-personal` — Slack Web API acting **as the session owner's own Slack user** (OAuth user token): message search, DMs/group DMs, thread history, user lookup, unread state, and posting as the caller. **Prefer `slack-personal` over `slack` when sending on the user's behalf** (e.g. "DM X for me") — the message comes from them, not a bot.
- `notion`, `salesforce` (read-only CRM/SOQL), `amplemarket`, `centralize`, `upside` — per-caller OAuth.
- `pylon` (read-only support issues) and `pylon-escalate` (Tier-1 triage writes: assign/tag/internal notes) — shared org token.
- **Request Lens is not one of these — do not call it through `mcp-svc`.** Its data is plain ClickHouse you can already read: `agent-scripts/query_clickhouse.py --service event-logging --query "SELECT … FROM request_lens.<table>"` (`SHOW TABLES FROM request_lens` to explore; customer/team usage lives in `events` and `error_logs` in the same warehouse). Routing it through the proxy only pushes a human approval link for data that needs no approval.

Auth and approval flows you must handle:

- **Missing OAuth grant** → the call fails `401` and prints an `authorize at:` URL. You cannot complete that flow yourself — the grant is bound to the human's identity behind Okta. Relay the link to the user verbatim, wait for them to finish, then retry the same call.
- **Gated writes** → sensitive write tools (e.g. `slack-personal post_message`) return `{"status": "approval_required", "approval_url": …}` instead of executing. The approval surfaces in the user's HQ queue; hand them the `approval_url`, and once approved the queued call executes (retry if it expired — note `expires_at`).

## Commits, PRs

Commit subjects look like `feat(project): description`, with `bug|chore|refactor|test|docs|style|perf|ci` as the other verbs. 
PR titles look like `[project, project2]: description`. If a project has a README and your change is relevant, update it.

PR descriptions and code comments must be generic and as concise as possible without losing value. Don't bake in incident- or issue-specific context (a ticket, an outage, "the bug where…") unless a future reader genuinely needs to know *why* the code is this way — then keep it to one line. Describe what the code does in general, not the change you made or the situation that prompted it.

AI-assisted commits must include an `Assisted-by: <harness>:<model>` Git trailer in the commit footer. Example: `Assisted-by: Capy:gpt-5.5`. Use the most specific model version you know, not the bare family name.

Run `format --branch origin/master --fix` and the project's typecheck (e.g. `pnpm typecheck`, `cargo check`) before every commit. CI gates merges on both.

Never open PRs in open-source / external (non-exa-labs) repos, even if the human explicitly asks you to. Instead, tell them to create the PR themselves locally.

## What to read for what kind of task

- PagerDuty, prod metrics, logs — start at agent-prompts/ONCALL.md
- SEVs - .agents/skills/oncall-sev/SKILL.md
- agent-prompts/CRAWLING.md
- Evals - read **all** of `python/minos2/MINOS.md` (the single canonical reference for minos2: eval workflow, presets, and CLI). It is one file — read it top to bottom, every section, before running or uploading anything. The CLI reference, upload contract, and launch rules are in the second half; skipping them will cause you to reinvent what the CLI already does.
- customer data or analytics — ClickHouse, Postgres — read `DATA.md`
- ML work (training runs, inference jobs, Flyte) is in `python/shared/legacy_examl_dontlook/AGENTS.md`
  - **DEPRECATED:** Do not use this legacy project for new work; use the isolated `python/training` projects instead. It remains only for live production imports by `python/services/embed` and `python/rolly/index_reconciler` until its minimal production inference/model surface is extracted.
- Atlas - read all three of `rust/shared/jata2/AGENTS.md`, `rust/services/atlas/AGENTS.md`, `rust/operators/AGENTS.md`, plus the relevant playbook in `rust/services/atlas/playbooks/`
- Ticketing, teams, PM work is `agent-prompts/PM.md`.
- Kronos, websets, `/answer`, `/research` → `typescript/kronos/kronos/AGENTS.md`; for websets debugging, also `playbooks/10-debugging-websets.md`; for Kronos agents (`/agent/runs`, `src/agent/`), also `.agents/skills/testing-agent-runs/SKILL.md`.
- Deploying services → `typescript/shared/exa-deploy/framework/AGENTS.md`.
- LLM calls / Charon (the LLM gateway) — keys, providers, the SDKs, and minting a per-use-case key for your identity → `infra/charon/AGENTS.md` (K8s service-account auth: "Consuming Charon from Other Services" section).
- Silk node / Silk Road (streaming crawl→embed→index pipeline: silk_framework nodes, Lance sinks, ScyllaDB dedup, Neuron embeddings) → `python/services/silk_node/README.md` + `python/services/silk_node/AGENTS.md`; team/PM workflow in `teams/silk_road/SILK_ROAD_AGENTS.MD`.

For anything non-trivial, reading these is not optional. We will check.

## minos2 landmines

The full CLI and eval workflow are in `python/minos2/MINOS.md`. **Read the entire file — not just the first half.** The CLI commands (`upload`, `exp abort`, `run`, `exp ls`, `presets`) and the upload contract are documented in the second half. If you skip them you will write custom scripts for things the CLI already handles. The things that will cost you hours if you miss them:

Never call `experiment.run()` directly — it bypasses Modal and profiling, and you lose the profiler data. Always `run_experiment(create_experiment)`, launched through Modal by default. `--no-profiled` is off-limits unless the human asks; `--local` is fine for local endpoints (CUI port-forwards). Leave API keys empty — `run_experiment()` pulls them from AWS SM via STS. Grader and summarizer `qps`/`concurrency` go to 2000/100000 because LLM call capacity is effectively unlimited.

`uv run experiments/your_exp.py` is the normal way to launch. Never `--attached`; use `--follow-logs` if you want to tail safely. Results come out of `cd python/minos2 && uv run minos2 --help` — `exp ls`, `exp show`, `grades`, `diff`, `trace`, `query`, `schema`.

Don't set `project` to `searchbench` or `searchbench-*` — those names are reserved for cronjobs and using them pollutes the dashboard. Pick something descriptive like `dev` or `my-experiment`. And `contextually_important_searchers` has to reference already-defined searchers, or the experiment just stalls.

Experiment `name` must be short and readable — **80 characters max**. Use a terse slug style: `"fast-vs-auto — simpleqa RAG"`, not a sentence describing every parameter. The name shows up in the dashboard and URLs; a wall of text makes the UI unusable.

Dashboard links to experiments use a path parameter: `https://minos.exa.ai/experiments/<experiment-id>`. `https://minos.exa.ai/experiments?id=<experiment-id>` is wrong and just lands on the home page. (Trajectories are the exception: `https://minos.exa.ai/trajectories?id=<trace-id>`.)

## PR dev stacks

**Tilt is mostly legacy and broken. Do not use it unless a human explicitly asks for Tilt; prefer PR dev stacks (`pr-<N>` preview environments) for deployed testing.**

"Trigger the dev stack" / "give me the dev stack URL" means the PR's deployed preview environment — a `pr-<N>` Pulumi stack deployed by `.github/workflows/dev-environment.yaml` — never a `share.internal.exa.sh` tunnel to something running on your box, and **never a tilt deploy**: `bin/tilt.sh` is a personal staging-namespace dev loop, not the dev stack, so don't reach for tilt when someone asks for the dev stack. Trigger it the way the service's workflow expects (most previews are default-on for non-draft PRs; some services gate on a label like `qes-dev-stack` / `atlas-rw-dev-stack`, or on pushing the service's tag) and hand back the deployed stack's URL from the workflow's `preview_url` output or the auto-updated PR comment.

## Vercel previews

Get a bypass token with `agent-scripts/get-vercel-bypass-token [project]`. In a browser, append `?x-vercel-protection-bypass=$TOKEN&x-vercel-set-bypass-cookie=true`. In tests, send the same values as headers. For UI changes, once the preview is up, screenshot the change, push it through `upload-content.sh`, and drop the link in the thread.

## Git hygiene

Rebase onto master, don't merge master into your branch. If it's not your branch, defer to the owner. 
Force-push only with `--force-with-lease`.

If the scope of a PR changes materially while you're working on it, update the title and description before pushing new commits — the automated reviewers read the description. 
If you're pushing to an older PR and time has passed, check whether it was already merged; if it was, open a new one instead of pushing to the merged branch.

## Flyte / overseer

**`overseer` (the `overseer-cli`) is the canonical CLI for launching, monitoring, and controlling Flyte executions.** It routes everything through the Overseer control plane — the only component that talks to FlyteAdmin — which stamps server-authoritative identity/attribution labels on every run. Do not reach for raw `pyflyte`, `flytectl`, or `flyte-monitor` unless a doc explicitly requires them.

Always use the `overseer` command directly — never `uv run overseer` or `python -m overseer_cli`. The `bin/overseer` wrapper handles nix/uv resolution automatically. Full command/flag reference: `python/shared/overseer-cli/README.md`.

```bash
overseer launch path/to/workflow.py:my_workflow  # launch any flytekit / @training_task workflow
overseer launch wf.py:my_wf --input epochs=5 --prefix my-run --wait logs
overseer iterate script.py --gpu h100       # run one script on a GPU pod, edit→rerun replacement
overseer plan path/to/workflow.py:my_workflow    # inspect tasks/resources/images without launching
overseer list                               # your own experiments (default)
overseer list --user all --limit 10         # everyone's experiments
overseer list --user felix --state running  # filter by user (email/username/bare name, all normalized)
overseer list --user all --session-id <id>  # filter by Devin session ID or Capy thread ID
overseer status <exec-id>                   # execution details: state, pods, scheduling, config
overseer status <exec-id> --json            # machine-readable output
overseer nodes <exec-id>                    # list workflow node executions
overseer data <exec-id> [--node-id n0]      # fetch workflow/node inputs and outputs
overseer attempts <exec-id> --node-id n0    # list task retry attempts for a node
overseer logs <exec-id> [--follow] [--filter 'error|exception']  # Loki logs for the execution
overseer metrics <exec-id> --keys loss,lr   # W&B metrics via Overseer's proxy (no WANDB_API_KEY)
overseer watch <exec-id> [--level finished|all]  # register-and-exit: wake this session when the execution finishes
overseer watch --list                       # list this session's watches
overseer unwatch <exec-id>                  # remove a watch
overseer cancel <exec-id>                   # terminate execution
overseer relaunch <exec-id>                 # relaunch from scratch
overseer resume <exec-id>                   # recover a failed run from its last checkpoint
overseer artifacts list -p <project>        # W&B artifacts: projects/list/search/lineage/import/delete/rename
overseer reports create --title t --execution-id <exec-id>  # W&B reports: create/list/show/append/delete
overseer pyflyte run --remote wf.py my_wf   # flytekit's own pyflyte tree, routed through Overseer
```

`overseer launch` serializes the workflow and builds/pushes its images locally (remote nix builders supported natively, or `--build-locally`), then registers and launches through Overseer. Bring your own `flytekit` / `exa_flyte`. Per-run secrets MUST go through `--secret KEY[=value]` / `--secret-file` — never through `--env`, workflow inputs, or source code, which all end up in plaintext.

**GPU priority:** launch GPU work at priority `-6` (the default). Never go higher without explicit human justification — it preempts other people's running jobs.

**Notifications** are controlled by two per-channel flags on `overseer launch`: `--slack-user-channel {off|finished|all}` and `--agent {off|finished|all}`. `finished` delivers terminal outcomes (succeeded/failed/canceled/terminated/stuck) plus custom events; `all` additionally delivers started events and Prometheus workflow/node alerts; `off` mutes the channel. `--slack-user-channel` defaults to `off`. `--agent` defaults to `finished` when the launch is detected as coming from an agent session (Devin/Capy) and `off` otherwise — so agent-launched runs report their terminal outcome to the session feed with no extra flags, and `--agent finished|all` outside a detected agent session is rejected. Agent-session notifications are capped at 10 delivered intermediate notifications by default; terminal execution outcomes are always delivered. Use `--agent-max-notifications <N|unlimited>` to override the cap. After reaching the cap, request more with `overseer agent-notifications request --additional 10`.

Agents should rely on these automatic defaults and only pass `--slack-user-channel` or `--agent` when the user explicitly requests different notification behavior.

**Waiting on executions — never poll, never babysit.** Do not re-run `overseer status`, loop on `overseer logs`, or hold `overseer launch --wait` open when you have nothing else to do while a run executes. Runs you launch from an agent session already notify the session on terminal outcome (the `--agent finished` default) — just end your turn. For any run that won't notify you (someone else's run, one launched without agent notifications, or one you're asked to babysit), register `overseer watch <exec-id>` and end your turn; the session is woken when the execution reaches a terminal state (`--level all` also delivers started events and alerts). A single `overseer status` snapshot to answer a question is fine — the second status check of the same execution in one session means you should have registered a watch.

Always extract Flyte URLs from the actual command output — don't try to compose them by hand. New workflows probably want `build_container_image`.

**Writing workflows — training_task, W&B, and artifacts:** the recommended way to run Flyte jobs is `exa_flyte`'s `@training_task` (`from exa_flyte.training import GPU, training_task`), not raw flytekit `@task` — it handles GPU scheduling, pod templates, EFA/IB networking, elastic multi-node PyTorch launch, and the default Nix image (see `python/shared/exa_flyte/README.md`). Use `exa_flyte`'s `@wandb` decorator (`from exa_flyte import wandb, WandbClient`) instead of the official `wandb` SDK — it runs through the Overseer W&B proxy with in-pod STS auth (no `WANDB_API_KEY`), injects a `WandbClient` into the task body, and records the run URL against the Flyte execution. For any S3 file/directory a workflow produces or consumes, strongly prefer `ArtifactFile` / `ArtifactDirectory` (`from exa_flyte import ArtifactFile, ArtifactDirectory`) over raw `FlyteFile`/`FlyteDirectory` or bare `s3://` strings — they carry artifact identity across executions, build the lineage graph automatically, and resolve by name (`from_name`) or S3 URI (`from_existing`), including as `overseer launch --input` values. Docs: `python/shared/exa_flyte/docs/WANDB_CLIENT.md` and `python/shared/exa_flyte/docs/ARTIFACT_LINEAGE.md`.

`flyte-monitor` and `query-flyte-workflow-logs` still work but `overseer status`/`overseer logs` cover their use cases.

## Secrets

Never write code that depends on a secret you haven't proven exists. Before referencing an AWS Secrets Manager secret id in a PR, verify it: `aws secretsmanager describe-secret --secret-id <name>` (or find it in `aws secretsmanager list-secrets`). Do not invent a plausible-sounding secret name and ship code reading it — a deploy that fails until a human hand-populates a secret is a broken deploy, not a TODO.

Know where secret values actually live before designing around them. Many stacks source secrets from *encrypted Pulumi config* (e.g. Hephaestus's `flyte_secrets_config` in `ansible/hephaestus/stacks/flyte/`), which neither agents nor other stacks can read — that is not the same thing as Secrets Manager. If the values you need are somewhere you can't read (encrypted Pulumi config, 1Password, another stack's state), stop and ask a human to provision or copy them **before** merging anything that depends on them; put the exact provisioning command in the ask.

## A few loose ones

When a tool's params aren't obvious, just search the web. If your environment is broken, debug it with a human — don't say "env issues, I'll do something else."

===== END OF ROOT AGENTS.MD FILE =====
