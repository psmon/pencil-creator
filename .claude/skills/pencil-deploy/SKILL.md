---
name: pencil-deploy
description: |
  펜슬 디자인 데모 사이트를 GitHub Pages로 배포하고, 블룸펜슬(ai-studio) 저장소의 최신 기능/템플릿/샘플을 현재 프로젝트로 영입하는 스킬.
  동기화(Sync) → 배포 준비(Prepare) → 퍼블리싱(Publish) 세 단계 중 필요한 것을 수행한다.
  다음 상황에서 반드시 이 스킬을 사용할 것:
  - "블룸펜슬 동기화해", "블룸펜슬 싱크", "bloom pencil sync"
  - "ai-studio에서 최신 영입", "상위 저장소 최신 반영", "최신 기능/템플릿/샘플 동기화"
  - "배포준비 해주세요", "배포 준비", "deploy 준비"
  - "퍼블리싱 해주세요", "배포해줘", "publish", "디자인 샘플 배포"
  - "데모 사이트 업데이트", "GitHub Pages 배포"
  - "샘플 페이지 퍼블리싱", "태그 달아줘"
---

# Pencil Deploy — 디자인 데모 동기화 · 배포

세 가지 단계를 분리해서 수행한다:

1. **동기화 (Sync)** — 블룸펜슬 저장소의 최신 기능/템플릿/샘플을 영입한다.
2. **배포 준비 (Prepare)** — `design/xaml/output/index.html` 을 갱신하고 커밋/푸시한다.
3. **퍼블리싱 (Publish)** — 버전 태그를 생성해 GitHub Actions 배포를 트리거한다.

각 단계는 독립 실행 가능하며, 보통 순서대로 이어진다.

> **경로 표기 원칙**: 이 스킬의 모든 경로 예시는 **프로젝트 루트 기준 상대 경로**로 표기된다. `D:/code/...`, `/Users/...` 같은 절대 경로는 사용자 기계마다 다르므로 지침/명령 예시에 절대 포함하지 않는다. 사용자가 절대 경로를 언급했더라도, 실행 시에는 현재 작업 디렉토리(프로젝트 루트)에서의 상대 경로로 변환해 사용한다.

---

## 0. 블룸펜슬 동기화 (Sync)

**발동**: "블룸펜슬 동기화해", "ai-studio에서 최신 영입" 등

블룸펜슬(ai-studio) 저장소에서 개발된 **최신 기능 · 템플릿 · 샘플**을 현재 프로젝트 저장소로 영입한다. 웹노리(또는 기타) 포크가 영어 번역/로컬 자산을 유지하는 동안, 상위 저장소의 핵심 진화(하네스 버전업, 케이스 추가, 신규 템플릿·샘플)를 병합하는 용도.

### 전제

- 블룸펜슬 저장소는 현재 프로젝트와 **형제 디렉토리 구조**로 체크아웃되어 있다고 가정한다.
- 경로는 **프로젝트 루트 기준 상대 경로**로만 표기한다. 예:
  - 현재 프로젝트 루트: `./`
  - 블룸펜슬 저장소 (기본 가정): `../../ai-studio/pencil-creator/`
- 기본 가정 위치에 없으면 사용자에게 상대 경로를 물어 확인한다. 절대 경로로 되묻지 말 것.

### 절차

```
Step 1. 차이 스캔 (프로젝트 루트에서 실행)
  → diff -rq ../../ai-studio/pencil-creator/ ./ \
      | grep -v "/\.git" | grep -v "\.idea" | grep -v "\.playwright-mcp" \
      | grep -v "/secret" | grep -v "/tmp" | grep -v "settings\.local\.json"
  → 출력을 "Only in source" / "Files ... differ" 두 카테고리로 정리

Step 2. 동기화 대상 분류
  → 영입 대상(아래 "영입 화이트리스트" 참조)만 복사
  → 유지 대상(아래 "유지 블랙리스트" 참조)은 절대 덮어쓰지 않음

Step 3. 파일 복사 (cp 사용, 경로는 모두 상대 경로)
  → 개별 파일: cp ../../ai-studio/pencil-creator/<path> ./<path>
  → 디렉토리: cp -r ../../ai-studio/pencil-creator/<dir>/ ./<dir>/
  → .pen 파일은 바이너리처럼 cp로만 다룬다 (Read/Grep 금지)

Step 4. 검수
  → git status 로 변경 목록 확인
  → 영입 대상 외 파일이 섞이지 않았는지 확인

Step 5. 커밋
  → 화이트리스트 경로만 git add
  → 커밋 메시지는 아래 형식 준수
  → 푸시 여부는 사용자 확인 후 진행
```

### 영입 화이트리스트 (소스 → 대상 덮어쓰기 / 신규 추가)

- `harness/harness.config.json` (버전/케이스 설정)
- `harness/knowledge/*.md` (평가 기준)
- `harness/engine/*.md` (상태 머신)
- `harness/agents/*.md` (평가자)
- `harness/docs/v*.md` (버전 히스토리 문서)
- `harness/logs/*.md`, `harness/logs/achievements/*`, `harness/logs/level-up/*` (로그/RPG)
- `.claude/skills/harness-usage/SKILL.md`, `.claude/skills/pencil-design/SKILL.md`, `.claude/skills/harness-creator/SKILL.md`, `.claude/skills/pencil-lang-pack/**` (스킬 본체)
- `design/design-md/**`, `design/design-md.pen` (DesignMD 템플릿)
- `design/wpf-animation.pen` (마스터 템플릿)
- `design/xaml/sample/**` (XAML 원본)
- `design/xaml/output/sample{N}/**` (HTML 샘플)
- `design/xaml/output/deploy-history.md`, `design/xaml/output/index.html` (샘플 인덱스)
- `design/json/**`, `design/icon/**`, `design/img/**` (메타/리소스)
- `projects/**` (프로젝트 디자인 — 경합 여부를 확인 후 영입)
- `upgrade-harness-design/prompt/**` (신규 프롬프트)

### 유지 블랙리스트 (덮어쓰기 금지)

- `README.md`, `README-*.md` (로컬 번역/변형본이 있을 수 있음 — 영문 버전 유지 등)
- `CLAUDE.md`, `CLAUDE-TIP.md` (프로젝트 지침이 로컬에서 확장됐을 수 있음 — diff만 보여주고 사용자 확인)
- `.gitignore` (프로젝트별 무시 규칙 차이)
- `.git/`, `.idea/`, `.playwright-mcp/`, `secret/`, `tmp/`
- `.claude/settings.local.json` (로컬 권한 설정)

### 커밋 메시지 형식

```
[동기화] ai-studio → {핵심요약}

- 하네스 v{이전} → v{이후}: {추가된 케이스/기능}
- 신규 템플릿: {파일명}
- 신규 샘플: sample{NN} ({한 줄 설명})
- 파이프라인/로그/achievement 상태 동기화

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

### 주의사항

- **절대 경로 금지**: 사용자 머신마다 드라이브 루트(`D:/code/...`, `/Users/...`)가 다르다. 이 스킬은 항상 프로젝트 루트(`./`)에서의 상대 경로로 동작한다. 절대 경로가 등장하는 순간 다른 환경에서 재현 불가능해진다.
- 소스 저장소가 기본 위치가 아니라면 사용자에게 **상대 경로**로 되묻는다. 예: "블룸펜슬 저장소가 `../../ai-studio/pencil-creator/` 에 없다면 상대 경로를 알려주세요."
- 영문 README 등 로컬 번역본은 블랙리스트에 명시된 경로여도 소스에 번역 파일이 추가 생겼다면 **새 파일만** 추가한다 (기존 번역본 덮어쓰지 않음).
- 동기화 직후 `git diff --stat` 으로 변경 규모를 요약 보고한다.
- 동기화 후 필요 시 1단계 → 2단계로 자연스럽게 이어간다.

---

## 1. 배포 준비 (Prepare)

**발동**: "디자인 샘플 배포준비 해주세요", "배포 준비" 등

### 절차

```
Step 1. 하위 샘플 폴더 스캔
  → design/xaml/output/ 하위의 sample{N}/ 폴더 목록 확인
  → 각 폴더 내 index.html 존재 여부 확인
  → index.html의 <title> 태그에서 제목 추출

Step 2. 인덱스 페이지 업데이트
  → design/xaml/output/index.html 의 demos 배열 업데이트
  → 기존 index.html의 HTML/CSS 템플릿 구조는 유지하고 JS의 demos 배열만 갱신
  → 새로 추가된 샘플만 추가하고, 기존 항목은 유지

Step 3. Git Commit + Push
  → git status로 변경 파일 확인
  → 변경 파일 목록을 기반으로 커밋 메시지 자동 생성
  → git add → git commit → git push origin main
```

### demos 배열 항목 구조

각 샘플을 스캔하여 다음 형태로 등록한다:

```javascript
{
  id: 'sample00',           // 폴더명
  title: '페이지 제목',      // index.html의 <title>에서 추출
  desc: '간단한 설명',       // index.html 내용을 파악하여 1~2줄 요약
  color: '#FFB7C5',         // 샘플별 구분 색상 (핑크 계열 순환)
  icon: '00',               // 폴더 번호
  tags: ['기술1', '기술2'],  // 사용된 주요 기술 태그
}
```

색상 팔레트 (순환):
```
#FFB7C5, #8B5CF6, #22D3EE, #4ADE80, #F59E0B, #FF6B6B, #A78BFA, #FB923C
```

### 커밋 메시지 형식

```
[배포준비] {변경 요약}

- 추가/수정된 샘플: sample00, sample01, ...
- index.html 데모 카드 갱신

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

---

## 2. 퍼블리싱 (Publish)

**발동**: "디자인 샘플 퍼블리싱 해주세요", "배포해줘" 등

### 절차

```
Step 1. 현재 버전 확인
  → design/xaml/output/deploy-history.md 에서 마지막 태그 버전 확인
  → git tag --list 'v*' --sort=-version:refname | head -1 로 교차 확인

Step 2. 다음 버전 계산
  → 버전 증가 규칙에 따라 다음 버전 산출

Step 3. 태그 생성 + Push
  → git tag {다음 버전}
  → git push origin {다음 버전}
  → GitHub Actions(.github/workflows/deploy-pages.yml)가 자동으로 배포 수행

Step 4. 배포 히스토리 기록
  → design/xaml/output/deploy-history.md 에 기록 추가
  → git commit + push (히스토리 파일만)

Step 5. 결과 안내
  → "퍼블리싱이 완료되었습니다. 접근 가능한 URL:"
  → 메인: https://{github-id}.github.io/pencil-creator/
  → 각 샘플: https://{github-id}.github.io/pencil-creator/sample00/
```

GitHub ID는 `git remote get-url origin`에서 추출한다.

---

## 3. 버전 관리 규칙

패치 버전을 1씩 증가하되, 패치가 9를 넘으면 마이너를 올린다.

```
v1.0.0 → v1.0.1 → v1.0.2 → ... → v1.0.9 → v1.1.0 → v1.1.1 → ...
v1.9.9 → v2.0.0
```

구현:
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

## 4. 배포 히스토리

`design/xaml/output/deploy-history.md` 에 배포 이력을 기록한다.

```markdown
| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-03-29 | v1.0.0 | 초기 배포: sample00 (Spring Animation Playground) |
```

---

## 5. 주의사항 (공통)

- 동기화 · 배포 준비 · 퍼블리싱은 모두 분리된 작업이다. 필요한 단계만 실행할 수 있고, 보통 0 → 1 → 2 순서로 이어진다.
- 퍼블리싱 전에 반드시 배포 준비(push)가 완료되어 있어야 한다.
- GitHub Pages 설정(Source: GitHub Actions)과 환경 보호 규칙(v* 태그 허용)이 사전에 완료되어 있어야 한다. 설정 방법은 `tools/DEPLOY-GITPAGE-TIP.md` 참조.
- index.html 템플릿의 HTML/CSS 구조를 변경하지 않는다. JS의 `demos` 배열만 갱신한다.
- **경로 표기는 언제나 프로젝트 루트 기준 상대 경로**다. 절대 경로(`D:/code/...`, `/Users/...`)는 사용자 머신에 종속되어 스킬 재현성을 깨뜨리므로 지침 · 명령 · 커밋 메시지 어디에도 쓰지 않는다.
