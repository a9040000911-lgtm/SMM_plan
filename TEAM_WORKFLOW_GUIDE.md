# Team Collaboration & Safety Guide (Team of 3)

This guide outlines a strict, safe workflow for collaborating on the Smmplan project to prevent code loss and production breaks.

## 🛡️ Core Rules of Safety

1. **Local Build First**: NEVER push code that hasn't been built locally. Run `npm run build` to catch TypeScript and Next.js errors before they reach the server.
2. **Main is Sacred**: The `main` branch must always reflect the working state of the live site. Direct pushes to `main` are discouraged.
3. **Merge Request Protocol**: All changes must be reviewed by at least one other team member.

## 🔄 The Smmplan Workflow

### 1. Preparation
Always start your work by getting the latest version:
```bash
git checkout main
git pull origin main
```

### 2. Feature Branching
Create a branch for every task:
```bash
git checkout -b feature/your-feature-name
```

### 3. Development & Testing
Work on your code, then run verification:
- `npm run dev` — check visual changes.
- `npm run build` — **CRITICAL**: ensure the project compiles for production.

## 🐳 Local Verification (Docker)

Before you push your changes, you should test them locally in a container environment to ensure everything works as expected.

### 1. Launch Development Stack
Use the dedicated development compose file:
```bash
docker-compose -f docker-compose.dev.yml up -d
```
- **App**: Accessible at [http://localhost:3001](http://localhost:3001)
- **Database**: Port `5433`
- **Redis**: Port `6380`

### 2. Verify Logs
If something isn't working, check the container logs:
```bash
docker logs -f smmplan-app-dev
```

### 3. Cleanup
To stop the local environment:
```bash
docker-compose -f docker-compose.dev.yml down
```

## 🚀 Deployment (CICD)

The GitLab Runner is now enabled. When you merge into `main`, the server will automatically:
1. Pull the latest code.
2. Build the Docker images.
3. Restart the site.

> [!WARNING]
> Because we use a **Hybrid Build** strategy (to save RAM), if the server build fails, it is usually because of a missing or incompatible local asset. Always ensure your `.next/standalone` folder is healthy and tracked if needed.

## 🆘 Troubleshooting
- **Build hangs**: Check `.dockerignore`. It should ignore the heavy `node_modules`.
- **Merge Conflicts**: If you get a conflict, `git merge main` into your feature branch, resolve it locally, and push again.
