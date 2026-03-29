---
name: pencil-deploy
description: |
  A skill for deploying the Pencil design demo site to GitHub Pages.
  Performs deployment preparation (index.html update + git commit/push) and publishing (tag creation → GitHub Actions auto-deploy).
  Use this skill in the following situations:
  - "Prepare for deployment", "Deploy prep", "prepare deploy"
  - "Publish please", "Deploy it", "publish", "Deploy design samples"
  - "Update demo site", "GitHub Pages deploy"
  - "Publish sample pages", "Create a tag"
---

# Pencil Deploy — Design Demo Site Deployment

Deploy sample demo pages from design/xaml/output/ to GitHub Pages.
Deployment is split into two stages: **Prepare** and **Publish**.

---

## 1. Prepare

**Trigger**: "Prepare design sample deployment", "Deploy prep", etc.

### Procedure

```
Step 1. Scan sub-sample folders
  → Check folder list under design/xaml/output/sample{N}/
  → Verify index.html exists in each folder
  → Extract title from <title> tag of each index.html

Step 2. Update index page
  → Update the demos array in design/xaml/output/index.html
  → Keep existing HTML/CSS template structure, only update the JS demos array
  → Only add newly discovered samples; keep existing entries

Step 3. Git Commit + Push
  → Check changed files with git status
  → Auto-generate commit message based on changed file list
  → git add → git commit → git push origin main
```

### demos Array Item Structure

Scan each sample and register in this format:

```javascript
{
  id: 'sample00',           // folder name
  title: 'Page Title',      // extracted from index.html <title>
  desc: 'Brief description', // 1-2 line summary based on index.html content
  color: '#FFB7C5',         // sample-specific color (cycling pink palette)
  icon: '00',               // folder number
  tags: ['tech1', 'tech2'], // major technology tags used
}
```

Color palette (cycling):
```
#FFB7C5, #8B5CF6, #22D3EE, #4ADE80, #F59E0B, #FF6B6B, #A78BFA, #FB923C
```

### Commit Message Format

```
[Deploy Prep] {change summary}

- Added/modified samples: sample00, sample01, ...
- Index.html demo cards updated

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

---

## 2. Publish

**Trigger**: "Publish design samples", "Deploy it", etc.

### Procedure

```
Step 1. Check current version
  → Check last tag version from design/xaml/output/deploy-history.md
  → Cross-verify with: git tag --list 'v*' --sort=-version:refname | head -1

Step 2. Calculate next version
  → Derive next version per version increment rules

Step 3. Create tag + Push
  → git tag {next-version}
  → git push origin {next-version}
  → GitHub Actions (.github/workflows/deploy-pages.yml) auto-deploys

Step 4. Record deployment history
  → Add record to design/xaml/output/deploy-history.md
  → git commit + push (history file only)

Step 5. Report results
  → "Publishing complete. Accessible URLs:"
  → Main: https://{github-id}.github.io/pencil-creator/
  → Each sample: https://{github-id}.github.io/pencil-creator/sample00/
```

GitHub ID is extracted from `git remote get-url origin`.

---

## 3. Version Management Rules

Increment patch version by 1; when patch exceeds 9, increment minor.

```
v1.0.0 → v1.0.1 → v1.0.2 → ... → v1.0.9 → v1.1.0 → v1.1.1 → ...
v1.9.9 → v2.0.0
```

Implementation:
```
patch + 1
if patch > 9:
  patch = 0
  minor + 1
  if minor > 9:
    minor = 0
    major + 1
```

---

## 4. Deployment History

Record deployment history in `design/xaml/output/deploy-history.md`.

```markdown
| Date | Version | Changes |
|------|---------|---------|
| 2026-03-29 | v1.0.0 | Initial deploy: sample00 (Spring Animation Playground) |
```

---

## 5. Notes

- Preparation and publishing are separate tasks. You can prepare and publish later.
- Preparation (push) must be complete before publishing.
- GitHub Pages settings (Source: GitHub Actions) and environment protection rules (allow v* tags) must be configured in advance. See `tools/DEPLOY-GITPAGE-TIP.md` for setup instructions.
- Do not modify the index.html template's HTML/CSS structure. Only update the JS `demos` array.
