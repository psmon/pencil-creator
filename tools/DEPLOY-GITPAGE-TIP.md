# GitHub Pages 배포 가이드 (태그 기반)

push와 배포를 분리하는 전략. 코드는 자유롭게 push하고, 태그를 달 때만 배포된다.

---

## 1. GitHub Pages 설정 (1회)

### 1.1 Pages 활성화

리포지토리 → **Settings** → **Pages** (좌측 메뉴)

```
Build and deployment > Source: "GitHub Actions" 선택
```

기본값 "Deploy from a branch"에서 반드시 변경할 것.

### 1.2 환경 보호 규칙 (태그 허용)

**Settings → Environments → `github-pages`** 클릭

Deployment branches and tags 섹션에서:

```
"Add deployment branch or tag rule" 클릭
→ Ref type: "Tag"
→ Name pattern: v*
→ Add rule
```

이 설정이 없으면 `Tag "v*" is not allowed to deploy to github-pages` 에러 발생.

---

## 2. GitHub Actions 워크플로우

`.github/workflows/deploy-pages.yml` 생성:

```yaml
name: Deploy to GitHub Pages

# 태그 생성 시에만 배포 (push와 배포 분리)
on:
  push:
    tags:
      - 'v*'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: design/xaml/output  # 배포할 디렉토리

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

`path` 값을 자신의 프로젝트에 맞게 변경할 것.

---

## 3. 배포 흐름

### 평소 작업 (배포 X)

```bash
git add . && git commit -m "update"
git push origin main
# → 코드만 올라감, Pages 배포 안 됨
```

### 배포할 때 (태그 생성)

```bash
git tag v1.0.0
git push origin v1.0.0
# → GitHub Actions가 트리거되어 Pages 배포
```

### 이후 버전 배포

```bash
git tag v1.1.0
git push origin v1.1.0
```

---

## 4. 배포 확인

| 항목 | URL |
|------|-----|
| Actions 상태 | `https://github.com/{user}/{repo}/actions` |
| 배포된 사이트 | `https://{user}.github.io/{repo}/` |
| 하위 페이지 | `https://{user}.github.io/{repo}/sample00/` |

배포는 보통 1~2분 소요. Actions 탭에서 초록 체크가 뜨면 성공.

---

## 5. 배포 디렉토리 구조 예시

```
배포 대상 디렉토리/
├── index.html          ← 메인 허브 (하위 링크 목록)
├── sample00/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── sample01/           ← 추가 데모
    └── index.html
```

`index.html`이 하위 sample들의 링크를 제공하는 허브 역할을 한다.

---

## 6. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Tag is not allowed to deploy | 환경 보호 규칙 | Settings → Environments → github-pages에서 `v*` 태그 규칙 추가 |
| Actions가 트리거 안 됨 | Source 설정 | Pages Source를 "GitHub Actions"로 변경 |
| 404 에러 | path 불일치 | 워크플로우의 `path`가 실제 디렉토리와 일치하는지 확인 |
| push 시 배포됨 | on 조건 | `on.push.tags`만 지정되어 있는지 확인 |
