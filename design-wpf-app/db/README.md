# Migration DB

XAML 마이그레이션 현황을 추적하는 JSON 기반 내장 DB.

## 스키마 버전 관리
- `schemaVersion`: 현재 스키마 버전 (숫자)
- `migrationLog`: 스키마 변경 이력 + 항목별 변환 기록

## 항목 필드 (v2)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | int | 고유 번호 |
| `sourceFile` | string | 원본 파일명 |
| `migratedFile` | string | 변환된 파일 경로 |
| `displayName` | string | 갤러리 표시 이름 |
| `category` | string | 분류 (Button, Nature, Cyberpunk 등) |
| `status` | string | 상태값 (아래 참고) |
| `animationSummary` | string | 사용자 관점 애니메이션 시나리오 한 줄 요약 |
| `coreAnimations` | string[] | 사용된 핵심 애니메이션 기법 목록 |
| `triggerType` | string | 발동 유형 (인터랙션형/자동반복형/시퀀스형/코드생성형) |
| `notes` | string | 기타 메모 |

## 상태값
- `미완성`: 아직 마이그레이션 안 됨
- `변환완료`: UserControl로 변환 완료
- `빌드성공`: 빌드 통과
- `테스트완료`: 최종 확인 완료
- `수정필요`: 문제 발견, 수정 필요

## migrationLog 기록 규칙

### 스키마 변경 로그
```json
{
  "version": 2,
  "date": "2026-03-30",
  "description": "설명",
  "schemaChanges": ["변경1", "변경2"]
}
```

### 항목 변환 로그
변환 완료 시 **핵심 애니메이션 기능을 요약**하여 기록한다.
단순 "변환됨/안됨"이 아니라, 이 컨트롤이 무엇을 하는지 한눈에 파악 가능해야 한다.

```json
{
  "version": 2,
  "date": "2026-03-30",
  "itemId": 1,
  "action": "변환완료",
  "summary": "Glass Effect Button — 호버→유리질감 페이드인+축소, 클릭→360도 회전, 이탈→복원. Opacity+Scale+Rotate 3종 조합 인터랙션"
}
```

## 스키마 마이그레이션 방법
1. `schemaVersion` 번호를 증가
2. `migrationLog`에 `schemaChanges` 포함한 변경 내역 추가
3. 기존 데이터를 새 스키마에 맞게 업데이트
