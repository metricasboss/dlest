# Deploying DLest Documentation

## Quick Deploy (Manual)

Deploy the documentation site to GitHub Pages:

```bash
# First time only - use gh-pages package
cd website
npx gh-pages -d build -b gh-pages

# After first deploy - can use Docusaurus command
cd website
USE_SSH=true npm run deploy

# Or from project root
npm run docs:deploy
```

## First Time Setup

1. **Configure Git SSH** (if not already done):
   ```bash
   # Check if SSH key exists
   ls -al ~/.ssh

   # If not, create one
   ssh-keygen -t ed25519 -C "your_email@example.com"

   # Add to GitHub
   cat ~/.ssh/id_ed25519.pub
   # Copy output and add at: github.com/settings/keys
   ```

2. **Test SSH connection**:
   ```bash
   ssh -T git@github.com
   # Should see: "Hi username! You've successfully authenticated"
   ```

3. **Deploy**:
   ```bash
   USE_SSH=true npm run docs:deploy
   ```

## Deploy with HTTPS (Alternative)

If you prefer HTTPS over SSH:

```bash
GIT_USER=your-github-username npm run docs:deploy
```

You'll be prompted for your GitHub password or personal access token.

## What Happens During Deploy

1. Builds the static site (`npm run build`)
2. Pushes to `gh-pages` branch
3. GitHub Pages serves from that branch automatically

## Configure GitHub Pages

After first deploy:

1. Go to: https://github.com/metricasboss/dlest/settings/pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` / `root`
4. Save

Site will be live at: https://metricasboss.github.io/dlest/

## Troubleshooting

### Authentication Failed

**Using SSH:**
```bash
# Verify SSH key is added
ssh -T git@github.com

# Use SSH deploy
USE_SSH=true npm run docs:deploy
```

**Using HTTPS:**
```bash
# Use Personal Access Token instead of password
# Create token at: github.com/settings/tokens
GIT_USER=your-username npm run docs:deploy
```

### Build Errors

```bash
# Clean and rebuild
cd website
npm run clear
npm run build
```

### Permission Denied

Make sure you have write access to the repository.

## CI/CD Alternative (Requires GitHub Actions)

If you have GitHub Actions available, the workflow at `.github/workflows/docs-deploy.yml` will deploy automatically on push to main.

To enable:
1. Go to Settings > Actions > General
2. Enable Actions
3. Push to main branch

## Manual Build + Push

If automatic deploy fails, you can do it manually:

```bash
# 1. Build
cd website
npm run build

# 2. Switch to gh-pages branch
git checkout --orphan gh-pages
git rm -rf .
cp -r build/* .
git add .
git commit -m "Deploy docs"
git push origin gh-pages --force

# 3. Switch back
git checkout main
```

## Environment Variables

Optional environment variables:

- `USE_SSH=true` - Use SSH instead of HTTPS
- `GIT_USER=username` - GitHub username for HTTPS
- `DEPLOYMENT_BRANCH=gh-pages` - Target branch (default: gh-pages)
- `CURRENT_BRANCH=main` - Source branch (default: current)

## Quick Reference

```bash
# Development
npm run docs:start    # Start dev server

# Build locally
npm run docs:build    # Build for production

# Deploy to GitHub Pages
npm run docs:deploy   # Deploy (configure SSH first)

# Test build locally
npm run docs:serve    # Serve production build
```
