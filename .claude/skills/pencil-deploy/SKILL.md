---
name: pencil-deploy
description: |
  펜슬 디자인 데모 사이트를 GitHub Pages로 배포하는 스킬.
  배포 준비(index.html 업데이트 + git commit/push)와 퍼블리싱(태그 생성 → GitHub Actions 자동 배포)을 수행한다.
  다음 상황에서 반드시 이 스킬을 사용할 것:
  - "배포준비 해주세요", "배포 준비", "deploy 준비"
  - "퍼블리싱 해주세요", "배포해줘", "publish", "디자인 샘플 배포"
  - "데모 사이트 업데이트", "GitHub Pages 배포"
  - "샘플 페이지 퍼블리싱", "태그 달아줘"
---

# Pencil Deploy — 디자인 데모 사이트 배포

design/xaml/output/ 의 샘플 데모 페이지를 GitHub Pages로 배포한다.
배포는 **준비(Prepare)**와 **퍼블리싱(Publish)** 두 단계로 분리된다.

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

## 5. 주의사항

- 배포 준비와 퍼블리싱은 분리된 작업이다. 준비만 하고 퍼블리싱은 나중에 할 수 있다.
- 퍼블리싱 전에 반드시 배포 준비(push)가 완료되어 있어야 한다.
- GitHub Pages 설정(Source: GitHub Actions)과 환경 보호 규칙(v* 태그 허용)이 사전에 완료되어 있어야 한다. 설정 방법은 `tools/DEPLOY-GITPAGE-TIP.md` 참조.
- index.html 템플릿의 HTML/CSS 구조를 변경하지 않는다. JS의 `demos` 배열만 갱신한다.
