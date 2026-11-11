# Publish AlmanacΦ without GitHub Actions

AlmanacPhi is a **static HTML, CSS, and JavaScript** site with no build step or server requirements. Its `index.html` lives in the repository root. It can be hosted without running npm, GitHub Actions, or other CI.

## Option 1: GitHub Pages from a branch (recommended)

1. Open [AlmanacPhi Settings → Pages](https://github.com/MichaelWave369/AlmanacPhi/settings/pages) while logged in as a repository administrator.
2. Under **Build and deployment**, choose **Deploy from a branch** as the source.
3. Select the **main** branch and folder **/(root)**, then click **Save**.
4. Wait for Pages to publish, and open **https://michaelwave369.github.io/AlmanacPhi/**.
5. Confirm the repository is not using `GitHub Actions` as the Pages source. That mode requires a successful runner job, which is not needed for this project.

**Important:** Pages may still use GitHub's internal publishing infrastructure, so a GitHub Pages incident can delay initial publication. Once configured, the app itself does not depend on Actions for normal use.

## Option 2: Host the static folder elsewhere

A Netlify site can publish the root folder with the build command **empty** and publish directory **.** (the repository root). If using a manual deploy, upload the contents of the repository root (not just `index.html`) so `./app.js`, `./engine.js`, `./crop-data.js`, `./styles.css`, and `./sw.js` remain reachable at the same relative paths.

A local static server can preview it without deployment:

```bash
python -m http.server 8000
```

Browse to `http://localhost:8000`. ES modules will not run reliably from a plain `file://` double-click.

## Release checklist

- [ ] Check crop search, season filters, and open/close crop guide dialogs.
- [ ] Change last and first frost dates; verify the month calendar updates.
- [ ] Check February/March and October/November planting windows, including garlic's cross-year window.
- [ ] Verify the lunar graphic (waxing = lit on right, waning = lit on left).
- [ ] Verify latitude affects day length but never overrides frost dates.
- [ ] Add, mark harvested, export, and delete a garden journal entry.
- [ ] Check responsive layout and keyboard navigation on desktop and mobile.
- [ ] Load online once, then confirm a later offline visit works with an already-installed service worker.
- [ ] Confirm no live weather, source-specific frost records, location detection, or validated lunar-yield claims are accidentally implied.
- [ ] Record launch date and site URL in the project README after independently verifying publication.

## If the two old workflow runs remain queued

The two November 11, 2026 Actions runs may remain stuck with no jobs assigned after GitHub's service incident. They are **not a prerequisite** for branch-based Pages publishing. Avoid making empty commits just to shake the queue. When GitHub Actions has recovered, cancel redundant stranded runs through the Actions UI and run the test suite once cleanly, or run `npm test` locally with Node.js 20+.

Until CI completes, label automated workflow status **unverified** rather than green. Manual or independent tests can provide separate evidence, but do not turn a queued workflow into a passing status.
