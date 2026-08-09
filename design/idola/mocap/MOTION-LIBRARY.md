# YUNA 모션 라이브러리 (본 애니 / mocap) — 누적 자산

> 상태머신형 모션 라이브러리. 확보한 클립을 계속 **누적**하고, 프리뷰/공연 연출에서
> 상태(state)로 조합·전환해 재사용한다. 리타겟은 `design/idola/scripts/`의 파이프라인 사용.
> **비상용/프리 동영상 전용.**

## 출처 & 라이선스
- **Bandai Namco Research Motion Dataset** (github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset)
- 라이선스 **CC BY-NC-ND 4.0** — 비상용, 원본 표기, 원본 그대로 공유(파생 배포 금지).
  본 프로젝트는 비상용 프리 동영상이며 원본 BVH를 표기와 함께 보관/재생만 함.

## 클립 목록 (dataset-1, 30fps→우리 24fps 타임스케일)

| 파일 | 상태(state) | 용도 | 비고 |
|------|-------------|------|------|
| `dataset-1_dance-short_normal_001.bvh` | **IDLE (기본상태)** | 정지 아닌 기본 대기 그루브 | 잔잔, 제자리 |
| `dataset-1_dance-long_normal_001.bvh` | **DANCE_MAIN** | 메인 안무(길고 큼) | 5.6MB, ~다수초 |
| `dataset-1_byebye_musical_001.bvh` | **WAVE** | 손 흔들기/인사 | 팔 위로 |
| `dataset-1_call_normal_001.bvh` | **CALL** | 관객 호응 유도/포인트 | |
| `dataset-1_guide_feminine_001.bvh` | **GESTURE** | 안내/여성적 제스처 | |
| `dataset-1_walk_musical_001.bvh` | **WALK** | 포메이션 이동 | 리듬감 있는 걷기 |

## 상태 전환(프리뷰 목표)
IDLE → DANCE_MAIN → (WAVE / CALL / GESTURE) → WALK(이동) → IDLE …
- 전환은 **NLA 크로스페이드(블렌드-in/out)**로 매끄럽게.
- 4인 군무: 동일 시퀀스 + **멤버별 시간 오프셋**(위상차)으로 자연스러운 군무.

## 다음 확보 후보 (누적)
- Bandai `walk_feminine/happy`, `byebye_active`, `guide_happy`, dataset-2(로코모션/핸드).
- 상용 필요 시: CMU(상용 가능) / Mixamo(K-pop) 로 대체 소스.

## 파이프라인 (검증된 방식 — `scripts/yuna_motionlib.py`)
1. BVH 임포트 → 스케일 0.0132(1.68m 정합), `axis_forward='-Z', axis_up='Y'`
2. 17본 매핑 + **월드 쿼터니언 리타겟**, rest 기준 = 각 클립 1프레임(중립 스탠스)
   - `off = bvh_ref.inv @ our_rest`, `q = bvh_now @ off` (월드 델타를 rest에 적용)
3. **각 멤버 타임라인에 직접 쿼터니언 키프레임 베이크**(NLA 슬롯 방식 폐기 — 아래 함정 참조)
   - 슬롯 경계 8프레임 **월드 공간 슬러프 크로스페이드**로 전환
   - 멤버별 위상 오프셋(y=0/u=4/n=8/a=12) 군무
4. 검증: 상태 순차 재생 + 전환 매끄러움 → mp4

### ⚠️ Blender 5.x 리타겟 함정 (2026-08-09 디버깅으로 확정)
- **NLA + 슬롯 액션이 헤드리스에서 정지 출력** → 직접 키프레임 베이크로 우회.
- **크로스페이드 좌표계 혼합**: `pose_bone.rotation_quaternion`(로컬)과 리타겟 `q`(월드)를
  슬러프하면 리그가 뒤집힘. `prev_w = MW @ pbb.matrix`(월드)로 읽어 같은 공간에서 슬러프.
- **stale-parent 뒤집힘(치명적)**: `pbb.matrix` 설정 후 `keyframe_insert` 전에
  `bpy.context.view_layer.update()`를 **본마다** 호출하지 않으면, 자식 본의 로컬 쿼터니언이
  갱신 안 된 부모 기준으로 계산돼 큰 회전(GESTURE/WALK)에서 오차가 누적→180° 폭발.
  회전이 작은 클립(dance-short)은 증상이 안 보여 놓치기 쉬움.
- **진단 교훈**: 골반 pitch가 rest에서 ~88°라 **euler 측정은 짐벌락으로 과소보고**.
  기울기는 업벡터 각도/쿼터니언 각도(짐벌 무관)로 측정할 것. 소스 골반은 실제로
  최대 32°만 기울고 발도 지면에 붙어 있음 — 뒤집힘은 항상 리타겟 수식 버그.
