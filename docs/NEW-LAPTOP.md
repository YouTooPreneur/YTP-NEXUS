# Moving to another laptop (start here)

**Written 4 Nov 2026 (D-198).** How to carry YTP Nexus to another laptop and continue exactly where we stopped. Use one laptop at a time.

**What travels:** one private **carry ZIP**, `YTP-SAAS-carry-<date>.zip`, made next to the project folder. It holds everything:
- the code and every document
- the whole conversation and Claude's memory notes (`history/`)
- the tracker and the Word copies
- the save history (`.git`), so the new laptop can save and upload on its own

It holds the private conversation, so share it with nobody.

## 1. On the old laptop, before you leave

1. Click **Run** on the upload line, so GitHub has every save:
   ```
   git -C "C:/Users/Spartan/Documents/pranav/ytp/YTP-SAAS" push
   ```
2. As the very last thing, make a fresh carry ZIP (it then includes everything done until now). It appears in `Documents\pranav\ytp\`:
   ```
   python "C:/Users/Spartan/Documents/pranav/ytp/YTP-SAAS/tools/history/make-backup.py" --with-git
   ```
3. Copy that ZIP to Google Drive or a pen drive.
4. Close Antigravity and the Claude app.

## 2. On the new laptop

1. **Install these:**
   - the Claude desktop app
   - Git for Windows (it includes Git Bash)
   - Node.js 24
   - pnpm 11.10.0: after Node.js, run `npm install -g pnpm@11.10.0`
   - Python 3 (tick "Add python.exe to PATH")
   - Docker Desktop (needed from TASK-0090: after it is merged, run `pnpm services:up` once; from TASK-0014 on, every check needs the services running). Start it once yourself and finish its first-run screens before step 3; leave it running.
   - Microsoft Edge or Google Chrome
   - Antigravity
2. **Unzip** the carry ZIP into a folder `Documents\pranav\ytp`, so that you get `Documents\pranav\ytp\YTP-SAAS`. Keep the name `YTP-SAAS`: Claude finds its saved sessions by it. The builders' copies are made next to it, in `Documents\pranav\ytp\ytp-work`.
3. **Open** the `YTP-SAAS` folder in the Claude app (Code tab). If it asks, approve the project's hooks (they keep saving the conversation). Then say:
   **"Continue from where we stopped. I am on the new laptop: do the new-laptop set-up in docs/NEW-LAPTOP.md."**
   Claude does steps 4 to 7 for you. They are written here in case you want to run them yourself.
4. **Set up the folder** (in Git Bash, inside `YTP-SAAS`):
   ```
   pnpm install --frozen-lockfile
   python tools/history/export-session.py --restore
   git worktree prune
   ```
   If Python is called `py` on that laptop, change `python` to `py` in `.claude/settings.json`.
5. **Check:** with Docker Desktop running, run `pnpm services:up` (it must end without an error). Make `infra/.env.test` from `infra/.env` if it is missing (Claude does it: the same file with `nexus_dev` changed to `nexus_test`; never print either file). Then `pnpm verify` must end with `verify: PASSED`.
6. **The card in progress:** a remade builder copy (`git worktree add`) has no `infra/.env` or `infra/.env.test`, because both are git-ignored: Claude copies both into it before the builder starts.
   - If TASK-0013 was **not** finished on the old laptop, make its builder copy again: `git worktree add ../ytp-work/TASK-0013 task/TASK-0013`, then give Antigravity Claude's TASK-0013 message.
   - If it **was** finished and saved there, its save travelled in the ZIP: tell Claude "TASK-0013 done" and Claude reviews it from the same branch.
7. **Windows:** set this Wi-Fi network to **Public** until TASK-0079, as on the old laptop. (After TASK-0090 and one `pnpm services:up`, the three services listen on this computer only, but the backend itself still listens on every address while it runs, until TASK-0079.)

## 3. Uploads to GitHub from the new laptop

The upload key stays on the old laptop on purpose: a key never travels. The new laptop gets its own, once:

1. Claude (or you, in Git Bash inside `YTP-SAAS`) runs:
   ```
   ssh-keygen -t ed25519 -f ~/.ssh/ytp_nexus_deploy -N "" -C "ytp-nexus-new-laptop"
   git config core.sshCommand "ssh -i '$HOME/.ssh/ytp_nexus_deploy' -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
   cat ~/.ssh/ytp_nexus_deploy.pub
   ```
2. **You** add the printed line on GitHub. It starts with `ssh-ed25519` and is the public half, so it is safe to paste:
   1. Open the repository `YouTooPreneur/YTP-NEXUS`, then **Settings**, then **Deploy keys**, then **Add deploy key**.
   2. Title it "new laptop" and paste the line.
   3. Tick **Allow write access**, then click **Add key**.
3. **Test:** `git fetch` must finish without asking for a password. After that, the Run upload line works as before.

## 4. What does not travel, and why that is fine

| What | On the new laptop |
|---|---|
| `node_modules` (the installed packages) | Rebuilt by `pnpm install` (step 4) |
| Docker's development database | Started fresh with `pnpm services:up` (nothing real is stored yet) |
| Playwright's test browser | Downloaded again by TASK-0013 (about 120 MB) |
| The upload key | A new one per laptop (section 3) |
| Claude's sessions on the old laptop | Restored from `history/` (step 4) |

## 5. Going back to the old laptop later

Do the same in the other direction: make a carry ZIP on the laptop you leave. On the other laptop, rename its old folder first (for example `YTP-SAAS-old`), unzip into a fresh `YTP-SAAS`, and run section 2 steps 4 and 5 again. If that laptop's Windows user name is different, also run the `git config core.sshCommand` line of section 3 again, so uploads use that laptop's own key. One laptop at a time, so the saves never fork.
