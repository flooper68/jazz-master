---
id: RES-018
title: Railway declarative service configuration
status: complete
created: 2026-07-09
stale_when: "Railway expands config-as-code beyond single deployment build/deploy settings, publishes a source-controlled project/service manifest, or releases an official Terraform/Pulumi-style provider."
---

# RES-018 - Railway declarative service configuration

## Research questions

1. Does Railway have a source-controlled declarative file that can define a
   project's services, databases, volumes, variables, networking, and links?
2. What does Railway's current config-as-code feature actually cover?
3. How does Railway support multi-service projects, monorepos, and reusable
   stacks if not through a project manifest?
4. What programmable alternatives exist for creating or updating services?
5. What should Jazz Master do with this information?

## Findings

### 1. Railway does not currently expose a full declarative project/service manifest

Railway's documented "Config as Code" is explicitly scoped to "the
configuration for a single deployment" through `railway.toml` or
`railway.json` [1]. The docs say everything in the build and deploy sections of
service settings can be specified in that file [1]. They do not describe a
top-level manifest for declaring a whole project, multiple services, databases,
volumes, service links, domains, or variable graphs.

This means `railway.toml` is not equivalent to `docker-compose.yml`,
`render.yaml`, `fly.toml` plus machines/apps provisioning, or Terraform. It is
deployment configuration for an already-created Railway service.

Single-source flag: this conclusion is based primarily on Railway's own current
docs and the absence of project/service resources in its config-as-code schema
docs. It should be rechecked if Railway changes that page or adds an IaC
provider.

### 2. `railway.toml`/`railway.json` is useful but intentionally deployment-scoped

Railway merges config files from the repo with dashboard service settings when
a deployment is triggered [1]. The resulting config is used only for that
deployment; dashboard settings are not updated by the code-defined values, and
code-defined values override dashboard values for the deployment [1].

Supported settings include builder choice, watch patterns, build command,
Dockerfile path, Railpack version, start command, pre-deploy command,
multi-region deployment config, healthcheck settings, restart policy, cron
schedule, environment-specific overrides, PR-environment overrides, and
deployment teardown timing [1].

For monorepos, Railway's config file lookup is service/package-oriented. The
monorepo docs note that config files can be detected at the package directory
and that isolated-service root directories need an absolute config file path
such as `/backend/railway.toml` [2].

### 3. Railway's reusable multi-service shape is templates, not repo-native manifests

Railway templates can capture infrastructure in a reusable format by defining
services, environment configuration, network settings, variables, and similar
stack shape [3]. Deploying a template creates a project with the template
services connected to their defined sources [4].

The creation flow is UI/composer based: create a template from scratch or from
an existing project, add services, choose GitHub or Docker image sources,
configure variables and settings, attach volumes, then create the template [3].
Template docs cover service settings such as root directory, public networking,
start command, healthcheck path, and volumes [3]. Template best practices also
cover private networking, generated secrets, reference variables, healthchecks,
and persistent storage [5].

Templates are therefore the closest first-party Railway feature to a
multi-service reusable stack, but they are not documented as a source-controlled
declarative file in the application repository. They are better understood as a
Railway-side reusable project blueprint.

### 4. Service creation is programmable through API, CLI, and MCP, but those are imperative workflows

Railway's public GraphQL API can create projects, create services from GitHub
repositories or Docker images, create empty services, update services, update
service instance settings, connect services to repositories, deploy services,
and delete services [6][7]. This is enough to build custom provisioning scripts,
but the docs present examples for API operations, not a declarative reconciler
that reads desired state from a repo and converges Railway to it.

The Railway CLI service commands can list/link/delete services and perform
operations like status, logs, redeploy, restart, scale, and filesystem
management [8]. Railway's MCP server exposes agent-facing tools for creating
projects, listing/linking services, deploying, deploying templates, managing
environments, setting variables, generating domains, and reading logs [9].
Those are useful operator/agent interfaces, but they are still command/API
workflows rather than a committed manifest of desired project state.

### 5. Current Jazz Master context argues against adding Railway IaC now

Jazz Master's current docs say production database infrastructure is
owner-owned, and agents should not provision Railway, Hyperdrive, Cloudflare
dashboard state, or production credentials. Given that constraint, Railway's
partial config-as-code feature should not be introduced until there is an
owner-provided Railway service that needs repo-owned deployment settings.

If Railway is later used for an app service, a `railway.toml` can version the
service's build/deploy details. It should not be treated as the source of truth
for creating the Railway project, Postgres service, volumes, domains, or
secrets.

## Recommendations

1. Do not plan on a single committed Railway file to declare the whole
   production stack. Railway's current first-party config-as-code does not cover
   that scope [1].
2. If the owner creates a Railway service later, use `railway.toml` only for
   service deployment settings that belong in code: build command, start
   command, healthcheck, restart policy, watch paths, and environment-specific
   deployment overrides [1][2].
3. If repeatable multi-service Railway setup becomes important, choose between:
   a Railway template for a reusable Railway-native blueprint [3][4], or a
   small owner-run/API-run provisioning script using the public API [6][7].
   Treat both as operational tooling, not as Jazz Master's current app
   architecture.
4. No immediate Jazz Master work item is needed. Production Railway
   provisioning remains owner-owned, and the current local Postgres/Drizzle path
   does not require Railway project configuration.
5. Revisit before any future task asks agents to create or reconcile Railway
   services from code. The key question then should be: "Has Railway added a
   project-level declarative manifest or official IaC provider since
   2026-07-09?"

## Sources

[1] Railway Config as Code reference -
https://docs.railway.com/config-as-code/reference (updated 2026-05-29,
accessed 2026-07-09).

[2] Railway Deploying a Monorepo -
https://docs.railway.com/deployments/monorepo (updated 2026-05-29, accessed
2026-07-09).

[3] Railway Create a Template - https://docs.railway.com/templates/create
(accessed 2026-07-09).

[4] Railway Deploy a Template - https://docs.railway.com/templates/deploy
(updated 2026-05-29, accessed 2026-07-09).

[5] Railway Template Best Practices -
https://docs.railway.com/templates/best-practices (accessed 2026-07-09).

[6] Railway Manage Projects with the Public API -
https://docs.railway.com/integrations/api/manage-projects (updated
2026-05-29, accessed 2026-07-09).

[7] Railway Manage Services with the Public API -
https://docs.railway.com/integrations/api/manage-services (updated
2026-05-29, accessed 2026-07-09).

[8] Railway CLI `railway service` -
https://docs.railway.com/cli/service (accessed 2026-07-09).

[9] Railway MCP Server - https://docs.railway.com/ai/mcp-server (updated
2026-05-29, accessed 2026-07-09).
