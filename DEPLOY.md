# Deploy: GitHub → Hostinger

This portfolio is a **static site** (HTML/CSS/JS). No build step. Push to GitHub → Hostinger pulls and publishes automatically.

## One-time setup

### 1. Install Git (if not installed)

Download and install: https://git-scm.com/download/win

During install, choose **“Git from the command line and also from 3rd-party software”**.

Restart Cursor/terminal after install.

### 2. Create a GitHub repository

1. Go to https://github.com/new
2. Repository name: `my-portfolio` (or any name)
3. **Public** or **Private** — both work with Hostinger
4. Do **not** add README, .gitignore, or license (this project already has them)
5. Click **Create repository**

### 3. Push this project to GitHub

Open terminal in the project folder (`C:\Users\UDAAN\Projects\my-portfolio`) and run:

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/my-portfolio.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

**First push:** GitHub may ask you to sign in. Use a [Personal Access Token](https://github.com/settings/tokens) as the password if prompted.

### 4. Connect GitHub to Hostinger

1. Log in to **Hostinger hPanel**
2. Go to **Websites** → select your site → **Manage**
3. Open **Advanced** → **Git**
4. Click **Create new repository** (or connect via GitHub OAuth if offered)
5. Settings:
   - **Repository:** your GitHub repo (`YOUR_USERNAME/my-portfolio`)
   - **Branch:** `main`
   - **Root directory:** leave empty or `/` (site files are at repo root: `index.html`, `assets/`, etc.)
   - **Deploy path on server:** `public_html` (default for main domain)
6. Click **Deploy** for the first manual deploy
7. Enable **Auto deployment**
8. Copy the **Webhook URL** from Hostinger
9. In GitHub: repo **Settings** → **Webhooks** → **Add webhook**
   - Payload URL: paste Hostinger webhook URL
   - Content type: `application/x-www-form-urlencoded`
   - Events: **Just the push event**
   - Save

## Day-to-day workflow

After the first setup, updating the live site is:

```bash
git add .
git commit -m "Describe your change"
git push
```

Hostinger receives the webhook and redeploys within a minute or two.

## Checklist before going live

- [ ] `index.html` is at the **repository root** (not inside a subfolder)
- [ ] LinkedIn and Behance links in the header point to your profiles
- [ ] Domain in Hostinger points to the site where you deployed
- [ ] Visit your domain and hard-refresh (Ctrl+F5) after first deploy

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `git` not recognized | Install Git, restart terminal |
| Push rejected (auth) | Use GitHub PAT instead of password |
| Site shows old content | hPanel → Git → **Redeploy**, or clear browser cache |
| 404 on site | Confirm deploy target is `public_html` and `index.html` exists there |
| Private repo | Connect GitHub account in Hostinger Git settings (OAuth) or add deploy key |

## Hostinger docs

- [Deploy a Git repository](https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/)
