---
name: team_deployment_workflow
description: Protocols for safe team collaboration (Git Flow) and automated hybrid deployment for the Smmplan project.
---

# Team Deployment & Collaboration Workflow

This skill regulates how multiple developers (3+) work on the Smmplan project to ensure production stability and code integrity.

## 🏗️ 1. Environment Strategy
- **Local**: Each dev runs `npm run dev`.
- **GitLab**: Central source of truth (`89.23.98.202:8080`).
- **Production**: Live site on the same server, managed via GitLab Runner.

## 👥 2. Safe Collaboration (Git Flow)
To avoid "overwriting" each other's work:
1. **Never push to `main` directly.**
2. **Work in Features**: `git checkout -b feature/task-name`.
3. **Daily Sync**: Always `git pull origin main` before starting work to avoid massive merge conflicts.
4. **Merge Requests (MR)**: Create an MR in GitLab for every feature.
   - At least 1 "Approve" from a teammate is required.
   - CICD pipeline MUST pass (Green check).

## 🚀 3. Deployment Protocol (Hybrid Build)
We use a **Hybrid strategy** (Local Build -> Remote Image) to save RAM on the server.

### Steps for Deployment:
1. **Verification**: Run `npm run build` locally. If it fails, fix the code.
2. **Commit & Push**: `git commit -m "..." && git push origin main`.
3. **Automation**: The GitLab Runner will detect the push and execute `scripts/migrate-server.sh`.

### Manual Deployment (Backup):
If CICD fails, use the manual transfer script I've prepared:
```powershell
./scripts/deploy-production.ps1
```

## 🛠️ 4. GitLab Runner Management
The runner acts as a bridge between GitLab and the server's Docker.

- **Check Status**: `docker ps | grep runner`
- **Register New Runner**:
  ```bash
  docker exec -it gitlab-runner gitlab-runner register \
    --non-interactive \
    --url "http://89.23.98.202:8080/" \
    --registration-token "YOUR_TOKEN_FROM_GITLAB" \
    --executor "docker" \
    --docker-image docker:latest \
    --description "smmplan-shell-runner" \
    --docker-volumes "/var/run/docker.sock:/var/run/docker.sock"
  ```

## ⚠️ 5. Safety Checklist
- [ ] **Typecheck**: No TypeScript errors (`npx tsc --noEmit`).
- [ ] **Lint**: No ESLint errors (`npm run lint`).
- [ ] **PRISMA**: Always push schema changes: `npx prisma generate` followed by `npx prisma db push` during deploy.
- [ ] **.env**: NEVER commit high-access keys. Use GitLab CI Variables for production secrets.

> [!IMPORTANT]
> A task is ONLY "Done" when it is live and verified on the server.
