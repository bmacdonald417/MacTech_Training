# Push this project to GitHub

Repo: **https://github.com/bmacdonald417/MacTech_Training.git**

## 1. Get Git in the terminal

- **If Git isn’t installed:** Install [Git for Windows](https://git-scm.com/download/win) and during setup choose **“Git from the command line and also from 3rd-party software”** so it’s added to PATH.
- **Restart Cursor** (or open a new terminal) after installing so the terminal sees `git`.

## 2. Run these commands in the project folder

Open a terminal in **MacTech Training** and run:

```powershell
# Go to project folder (if not already there)
cd "C:\Users\bmacd\.cursor\MacTech Training"

# Initialize repo (only if this folder is not already a git repo)
git init

# Add the GitHub repo as remote (use "origin" if you prefer)
git remote add origin https://github.com/bmacdonald417/MacTech_Training.git

# If you already had a remote named "origin", update it instead:
# git remote set-url origin https://github.com/bmacdonald417/MacTech_Training.git

# Stage all files (respects .gitignore)
git add .

# First commit
git commit -m "Initial commit: MacTech Training app"

# Push to GitHub (main branch; use "master" if your default is master)
git branch -M main
git push -u origin main
```

## 3. Authentication

- **HTTPS:** When you `git push`, Windows may prompt for credentials. Use your GitHub username and a [Personal Access Token](https://github.com/settings/tokens) (not your GitHub password).
- **SSH:** If you use SSH keys, change the remote to:  
  `git@github.com:bmacdonald417/MacTech_Training.git`  
  then run:  
  `git remote set-url origin git@github.com:bmacdonald417/MacTech_Training.git`

## One-line script (PowerShell)

After Git is installed and in PATH, you can run:

```powershell
cd "C:\Users\bmacd\.cursor\MacTech Training"; if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Host "Install Git from https://git-scm.com/download/win and restart the terminal." } else { git init; git remote add origin https://github.com/bmacdonald417/MacTech_Training.git 2>$null; if ($LASTEXITCODE -ne 0) { git remote set-url origin https://github.com/bmacdonald417/MacTech_Training.git }; git add .; git status; git commit -m "Initial commit: MacTech Training app"; git branch -M main; git push -u origin main }
```

If the repo already has a remote, the script updates it to the URL above and then adds, commits, and pushes.
