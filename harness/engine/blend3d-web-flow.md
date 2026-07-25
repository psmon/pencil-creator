---
name: blend3d-web-flow
scope: case-M
since: v2.10.0
triggers:
  - "블렌더로 모델링하고 웹으로"
  - "3d 모델링 후 웹 구현"
  - "모델링 먼저 웹은 나중에"
  - "blend to web"
  - "블렌더 씬을 three.js로"
---

# Blend3D → Web Flow (Case M: Modeling-First Pipeline)

> **원칙: 모델링을 먼저 한다 → 웹을 구현한다.**
> 3D 공간 설계는 Blender(실좌표·실치수)에서 확정하고, 웹(Three.js)은 그 결과를
> **동일 좌표·동일 치수로 재구축**한다. 웹에서 즉흥적으로 공간을 설계하지 않는다.

## 플로우 (7단계)

```
① 레퍼런스 분석
   영상(ffmpeg 프레임 추출) / 이미지 / 실측 자료에서
   구조·배치·비례·라이팅·무드를 수치로 정리한다.
   영상 입력이면 video-motion-analysis 스킬 병용 가능.

② Blender MCP 모델링
   execute_blender_code로 단계별(청크) 모델링.
   - 단위: 미터 실치수. 배치 데이터는 파이썬 리스트/딕셔너리로 명세화
   - 각 청크 후 get_viewport_screenshot 또는 EEVEE 렌더로 즉시 검증
   - 실내 컷어웨이가 필요하면 파사드 머티리얼 use_backface_culling=True

③ .blend 자산 저장 (내부 관리 공간)
   경로: design/blend/{scene-name}.blend  ← 재활용 가능한 디자인 자산
   외부 경로(임시 폴더 등)에 두지 않는다. 커밋 대상.

④ Three.js 재구축
   - 좌표 변환 규칙: Blender(x, y, z) → Three(x, z, -y)
   - 배치 수치는 ②의 데이터 명세를 그대로 이식 (좌표 새로 잡기 금지)
   - 프로시저럴 텍스처(노드)는 웹에서 CanvasTexture 등으로 등가 재현
   - 대량 반복 오브젝트는 InstancedMesh

⑤ 카메라 연출
   - 모드별 t(초) → (pos, target[, fov]) 순수 함수로 정의
   - 모드 전환은 이즈인아웃 블렌딩 (급점프 금지)
   - 실내 진입 연출: 어프로치 → 개구부(유리) 관통 → 룩어라운드 3단 구성
   - 실내는 광각(FOV 55~65), 실외는 표준(35~45)

⑥ 검증
   - 로컬 HTTP 서버 + Playwright로 콘솔 에러 0 확인
   - 모드별 스크린샷 캡처로 구도/노출/지오메트리 검수
   - z-파이팅(면 겹침), 노출 과다, 프레임 저하 점검

⑦ 배포
   pencil-deploy: 배포준비(index 카드) → 퍼블리싱(태그)
```

## 산출물 체크리스트

- [ ] `design/blend/{name}.blend` — 마스터 3D 자산 (커밋)
- [ ] `design/xaml/output/sample{N}/index.html` — 웹 재구축 (단일 파일)
- [ ] 레퍼런스 분석 요약 (프레임/수치) — 로그 또는 커밋 메시지
- [ ] 검증 스크린샷 (모드별 최소 1장)

## 평가

3축 평가 기준: [../knowledge/blend3d-web-craft.md](../knowledge/blend3d-web-craft.md)
파이프라인 보너스: M→W 성격이 한 몸이므로 Case M 단독 100점 + S/W 연계 시 M_W 1.3x
