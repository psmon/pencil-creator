# Windows 환경 도구 활용 가이드

---

## 1. Playwright MCP — WebM 비디오 녹화

Playwright MCP의 `browser_run_code`를 통해 웹 애니메이션을 WebM 비디오로 녹화할 수 있다.

### 핵심 원리

- MCP의 `browser_take_screenshot`은 정적 캡처만 지원
- `browser_run_code`에서 `page.context().browser()`로 브라우저 객체에 접근
- `recordVideo` 옵션으로 새 컨텍스트를 생성하면 녹화 가능
- `context.close()` 호출 시 비디오 파일이 저장됨 (WebM 포맷)

### 코드 패턴

```javascript
// browser_run_code에서 실행
async (page) => {
  const browser = page.context().browser();

  const context = await browser.newContext({
    recordVideo: {
      dir: 'D:/pencil-creator/tmp/playwright/video/',
      size: { width: 1400, height: 900 }
    }
  });

  const videoPage = await context.newPage();
  await videoPage.setViewportSize({ width: 1400, height: 900 });
  await videoPage.goto('http://localhost:8768/');

  // 페이지 조작 (스크롤, 클릭 등)
  await videoPage.evaluate(() =>
    document.getElementById('section-bloom').scrollIntoView({ behavior: 'instant' })
  );
  await videoPage.waitForTimeout(500);
  await videoPage.click('#bloomPlay');
  await videoPage.waitForTimeout(10000); // 애니메이션 대기

  // context.close() 호출 시 비디오가 저장됨
  const videoPath = await videoPage.video().path();
  await context.close();

  return `Video saved to: ${videoPath}`;
}
```

### 주의사항

- 출력 포맷은 **WebM 고정** (Playwright 네이티브)
- 파일명은 자동 생성 (해시값.webm)
- `context.close()`를 호출해야 파일이 완성됨
- 저장 경로(`dir`)는 사전에 생성되어 있어야 함

---

## 2. ffmpeg — Windows 설치 및 활용

### 설치 방법 (npm 경유)

Windows bash 환경에서 winget 설치 후 PATH가 즉시 반영되지 않는 문제가 있다.
`ffmpeg-static` npm 패키지를 통해 안정적으로 사용 가능하다.

```bash
npm install -g ffmpeg-static
```

설치 후 바이너리 경로:
```
C:/Users/{사용자}/AppData/Roaming/npm/node_modules/ffmpeg-static/ffmpeg.exe
```

bash에서 사용 시:
```bash
FFMPEG="/c/Users/{사용자}/AppData/Roaming/npm/node_modules/ffmpeg-static/ffmpeg.exe"
"$FFMPEG" -version
```

### WebM → GIF 변환 (고품질 palette 방식)

```bash
"$FFMPEG" -y -i input.webm \
  -vf "fps=15,scale=700:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  output.gif
```

- `fps=15`: 프레임 레이트 (낮출수록 파일 작아짐)
- `scale=700:-1`: 가로 700px, 세로 비율 유지
- `palettegen + paletteuse`: GIF 256색 최적화 (품질 향상)

### WebM → MOV 변환 (H.264)

```bash
"$FFMPEG" -y -i input.webm \
  -c:v libx264 -pix_fmt yuv420p -crf 23 \
  output.mov
```

- `crf 23`: 품질 (낮을수록 고품질, 18~28 권장)
- `pix_fmt yuv420p`: 호환성 보장

### 파일 크기 참고 (10초 1400x900 애니메이션 기준)

| 포맷 | 크기 | 용도 |
|------|------|------|
| WebM | ~1MB | 원본 보관 |
| GIF | ~1.2MB | 슬랙/위키 미리보기 |
| MOV | ~235KB | 가장 작은 고품질 |
