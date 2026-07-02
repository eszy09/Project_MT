# GitHub Setup and Workflow

## Current state

- `Project_MT` is prepared as a standalone local Git repository.
- GitHub CLI is required to create and publish the remote repository from this environment.
- The GitHub connector can inspect accessible repositories but cannot create a new one.

## One-time prerequisites

Install GitHub CLI:

```powershell
winget install --id GitHub.cli
```

Authenticate:

```powershell
gh auth login
gh auth status
```

## Create and connect the repository

Choose visibility only after asking the project owner for guidance.

Private:

```powershell
cd Project_MT
gh repo create Project_MT --private --source=. --remote=origin --push
```

Public:

```powershell
cd Project_MT
gh repo create Project_MT --public --source=. --remote=origin --push
```

Verify:

```powershell
git remote -v
git status
gh repo view --web
```

## Branch workflow

- `main` must remain releasable.
- Use `codex/<short-description>` for Codex-created branches.
- Open pull requests rather than pushing feature work directly to `main`.
- Require CI before merge.
- Prefer squash merge for a concise history.

## Commit style

Examples:

```text
scaffold web and API applications
persist authenticated user sessions
add set-by-set workout logging
```

## Required GitHub protections

- Protect `main`.
- Require pull-request review when collaborators are added.
- Require CI checks.
- Block force pushes.
- Enable Dependabot alerts.
- Enable secret scanning where available.

