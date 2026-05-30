# Claude Code Skills

Slash commands for the Fitnation project. Available automatically in Claude Code once you open this repo — no setup needed.

## Requirements

[Claude Code](https://claude.ai/code) — CLI, desktop app, or VS Code / JetBrains extension.

## How to use

Type `/skill-name` in any Claude Code session inside this repo. Skills appear in Claude's autocomplete.

## Available skills

| Skill | When to use |
|---|---|
| `/git-workflow` | Look up git branching rules, EAS build process, or PR/hotfix flow |

General skills (`/diagnose`, `/tdd`, `/improve-codebase-architecture`, `/grill-with-docs`, `/zoom-out`, `/write-a-skill`) are available globally from `~/.claude/skills/` and work in any project.

## How it works

Claude Code loads everything in `.claude/skills/` automatically when you open the project. Each skill is a directory with a `SKILL.md` (the instructions Claude follows) and optional supporting files referenced from it.

## Plugins

The repo enables a set of official Claude Code **plugins** via `.claude/settings.json`. These activate automatically — you don't type a slash command, Claude reaches for the right one based on what you're doing.

Enabled plugins: `superpowers`, `frontend-design`, `github`, `vercel`, `security-guidance`

The most useful Superpowers skills:

| Skill | When it kicks in |
|---|---|
| `brainstorming` | Before building anything — explores intent & design before code |
| `systematic-debugging` | On any bug or failing test — reproduce → minimise → hypothesise → fix |
| `test-driven-development` | Implementing a feature or fix — red → green → refactor |
| `writing-plans` | Multi-step work — turns a spec into a reviewable plan before touching code |
| `verification-before-completion` | Before claiming "done" — forces running the check and showing evidence |

> First time: run `/plugin` in Claude Code to confirm the plugins show as enabled. If they don't, make sure you've pulled the latest `main` and reopened the project.

## Adding a new skill

Run `/write-a-skill` and Claude will guide you through it. Once done, commit the new directory under `.claude/skills/`.
