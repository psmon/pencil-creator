# Case P: 웹 ZIP 퍼블리셔 앱 디자인

- **날짜**: 2026-03-28
- **Case**: P (WPF 조사 → Pencil 구현)
- **파일**: projects/design/publisher-app.pen

## 주제
ZIP 파일을 업로드하여 웹사이트를 게시/관리하는 퍼블리셔 앱 4개 화면 디자인

## WPF 리서치 요약
- **DoubleAnimation**: Opacity 0→1 (0.5s EaseOut) — 드롭존/카드 페이드인
- **ScaleTransform**: ScaleX/ScaleY 1→1.02 — 카드 호버 효과
- **ColorAnimation**: 버튼 배경색 전환 — 인터랙티브 피드백
- **Storyboard DoubleAnimation**: Width 0→100% RepeatBehavior — 프로그레스바

## 디자인 산출물
| 화면 | 설명 |
|------|------|
| Screen/Dashboard | 통계 카드 4개 + 게시 사이트 테이블 |
| Screen/Upload | 드래그&드롭 영역 + 프로그레스바 + 완료 목록 |
| Screen/Publish | 폼 필드(이름/게시자/소개/파비콘) + 유효검사 결과 |
| Screen/ViewSites | 6개 사이트 카드 그리드 (3x2) + 새창 열기/삭제 |

## 스타일
- Soft Bento Clinical + Tangerine Orbit 컬러
- accent: #FF5C00 (오렌지), surface: #F7F8FA, foreground: #1A1A1A
- 폰트: Inter (UI), Geist Mono (데이터)
- 라운드: 16px 카드, 9999px 버튼

## 3축 평가
| 축 | 점수 | 근거 |
|----|------|------|
| P1 리서치 신규성 | 28/35 | 빈 파일 시작, 4종 WPF 기법 반영, 다양한 UI 패턴 |
| P2 시각화 표현력 | 25/35 | 일관된 테마, 그라데이션 카드, 애니메이션 노트 포함 |
| P3 메타 완결성 | 20/30 | WPF→CSS 매핑 기록, 출처 참조, .xaml 파일 미생성 |
| **총점** | **73/100** | **B등급** |

## 출처
- [Animation using Storyboards in WPF - CodeProject](https://www.codeproject.com/Articles/364529/Animation-using-Storyboards-in-WPF)
- [Storyboards Overview - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/storyboards-overview)
- [Scale & Rotate UI with WPF Storyboards - Medium](https://medium.com/@artillustration391/scale-rotate-your-ui-dynamic-transforms-with-wpf-storyboards-602bcbc061f3)
