# Pencil Creator — Claude Code 프로젝트 지침

## 스킬 구성
- `.claude/skills/pencil-design/` — Pencil MCP로 디자인 아이디어 시각화
- `.claude/skills/harness-usage/` — Case P/W 워크플로우 실행 + 평가
- `.claude/skills/harness-creator/` — 하네스 구조 개선 + 사용법 안내

## 핵심 MCP
- **Pencil MCP**: .pen 파일 생성/편집 (batch_design, get_screenshot 등)
- **Playwright MCP**: HTML 페이지 섹션별 스크린샷 캡처 (선택)

## 경로 규칙
- 모든 경로는 프로젝트 루트 기준 **상대경로** 사용
- 디자인 파일: `design/{이름}.pen`
- HTML 산출물: `design/xaml/output/sample{N}/index.html`
- 이미지: `image/pencil/sample{N}/`
