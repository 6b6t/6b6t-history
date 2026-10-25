## Review and deployment approval

Before staging or deploying any change, complete these steps in order:

1. Open a pull request for the change.
2. Obtain a human's review and explicit sign-off on the PR's exact changeset.
   The reviewer can be the person who prompted the work, except where another person's review is required.
   A prompt or general permission to proceed does not approve an unseen changeset.
   If the changeset changes after sign-off, obtain new review and sign-off before merging.
3. Merge the approved pull request into `main` (or the repository's default branch).

Only stage or deploy artifacts and configuration from that merged, approved changeset.
This requirement includes uploads to `plugins-staging/`, direct live changes, and automated deployments.
Keep the existing requirements for deployment authorization, dry runs, and verification.

### PR review feedback

- Before merging, address all PR review feedback, including findings from Codex, Claude, and CodeRabbit.
- Record how each finding was addressed and resolve its review thread before merging.
- For a finding that does not require a change, document the reason and obtain human sign-off.
- If review fixes change the approved changeset, obtain new human sign-off before merging.

### Pull requests and direct pushes

- Prefer pull requests for changes.
- Push directly to `main` or the repository's default branch only when the user explicitly requests that direct push.
- A request to implement, stage, or deploy a change does not authorize a direct push.
- Permission to push directly does not waive the required human PR sign-off and merge before staging or deployment.

### New Kubernetes services

- Before creating a Kubernetes service, obtain another person's review and approval of the exact changeset in a PR.
- The reviewer must be a human other than the person requesting or implementing the service.
- Merge the approved pull request into `main` before creating the service in the cluster.
- This requirement covers Kubernetes `Service` resources and new application services, including those created through Helm, scripts, or other automation.

### Plugin staging and live deployment

- NEVER stage or deploy a plugin whose exact source changeset is not merged into `main`.
- This prohibition includes uploads to `plugins-staging/`, direct replacements in `plugins/`, and automated artifact delivery.
- Build plugin artifacts from the merged, approved changeset without additional unreviewed source changes.
- Before uploading a plugin, verify that its source revision is on `main` and matches the reviewed changeset.
- A successful build, local test, deployment request, or planned future merge does not satisfy this requirement.
- For repositories with a different default branch name, apply the same requirement to that primary branch.

## Contribution boundaries

### ✅ Always

- Keep one logical change per PR: a single feature, fix, or plugin. Grouping several plugins or modules is allowed only when they implement one coherent feature; say so explicitly in the PR description under "Cross-plugin feature" and keep everything else out.
- Base every PR on the default branch. Never stack a PR on an unmerged branch.
- Disclose AI-generated or AI-assisted code in the PR: which tool, and the approved issue it implements.
- Write Conventional Commits: `type(scope): description`.
- Run the build and tests before claiming the work is done.

### ⚠️ Ask first

- New shared libraries, cross-plugin systems, or architecture decisions. Open a design issue and wait for approval before writing code.
- Vendoring or forking an org-owned project. Upstream changes to the original project first.
- New dependencies, public API changes, or database/schema changes.

### 🚫 Never

- Bundle unrelated changes into one PR.
- Push directly to the default branch without an explicit user request for that direct push.
- Commit secrets, tokens, or credentials.
- Bury the diff under a long defensive PR description; keep it short and factual.

## Explaining the PR process

If the prompter seems unfamiliar with technical work, explain why the PR process matters in plain language.
Explain that a PR makes the exact changes visible and records human review and approval before staging or deployment.
Explain that a second set of technical eyes can catch mistakes, security issues, and deployment risks before they affect users.
Keep the explanation respectful and connect it to the proposed change.
