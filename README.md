# Olinske

Signal Over Hype by Zach Olinske.

Personal technical blog focused on enterprise cloud, AI readiness, resilience, and operating models.

## Why this stack

- Astro static site for speed, SEO, and low operational overhead
- GitHub-native workflow for issue-driven content orchestration
- Agent-ready structure under .github/agents and prompts/
- LinkedIn-first distribution support in data/linkedin

## Local setup

1. Install Node.js 20+
2. Install dependencies:
   npm install
3. Run dev server:
   npm run dev
4. Build production output:
   npm run build

## Environment

Copy `.env.example` to `.env` and adjust values as needed.

- `SITE_URL`: Canonical production URL used during Astro build

## Publishing model

- Keep repository private while building drafts and workflows
- Publish manually by default (human gate)
- Enable automated deployment once quality gates are tuned

## Editorial workflow states

- `backlog`: Idea accepted but not actively worked
- `research`: Sources and framing in progress
- `draft`: Initial post draft in progress
- `review`: Human review in progress
- `approved`: Cleared for scheduling or publish prep
- `scheduled`: Ready with a publication date
- `published`: Live on site

State definitions and transitions are tracked in `.github/editorial-workflow-states.yml`.

## Quality gates

- Draft gate: schema + Astro check + build
- Review gate: draft gate plus unresolved-claim checks
- Publish gate: review gate plus published-post and required agent-artifact checks

Run locally:

- `npm run ci:draft`
- `npm run ci:review`
- `npm run ci:publish`

Agent artifact contract details: `docs/agent-artifact-contract.md`

## Source intelligence loop

- Curated watchlist: `docs/blog-watchlist.md`
- Monthly capture template: `data/backlog/source-insights-template.md`
- GitHub issue template: `.github/ISSUE_TEMPLATE/source-scan.yml`

Use this monthly loop to convert external insights into prioritized post candidates.

## Repo model

- Keep this repository private for editorial operations.
- Promote only approved, public-safe output to a separate public repository.
- Public export includes CI and Azure Web App deployment workflow scaffolding.
- Azure deployment uses GitHub OIDC federation secrets (latest standard), not long-lived credential blobs.

Details: `docs/repo-split-strategy.md`

Publish checklist: `docs/publish-preflight-checklist.md`

## Suggested GitHub workflow

1. Create issue using the Blog Post Pipeline template
2. Move issue in project board using defined editorial states
3. Generate draft in `content/posts`
4. Open PR and pass draft/review workflows
5. Manually run publish gate and deployment when approved

## Directory overview

- content/posts: markdown posts
- docs: strategy, policy, guardrails
- templates: post and distribution templates
- prompts: prompt packs for helper agents
- .github/agents: orchestrator + specialist agent specs
- .github/workflows: CI and deployment workflows

## Next steps

- Add your first post from templates/post-template.md
- Define editorial rules in docs/editorial-policy.md
- Connect repository to GitHub Pages or your preferred host
