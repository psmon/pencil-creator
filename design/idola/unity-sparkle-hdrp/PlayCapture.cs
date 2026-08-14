using UnityEngine;
using System.IO;
#if UNITY_EDITOR
using UnityEditor;
#endif

// Deterministic Play-mode frame capture. Uses Time.captureFramerate so the REAL Animator
// advances 1/fps per frame, then renders the Main Camera to disk. Audio is muted (mux later).
[DefaultExecutionOrder(-100)]
public class PlayCapture : MonoBehaviour
{
    public int fps = 24;
    public int startFrame = 0;      // song-time offset (frames) — lets us preview a climax window
    public int totalFrames = 5160;  // number of frames to CAPTURE from startFrame
    public int width = 1280, height = 720;
    public string subDir = "PlayFrames";

    Camera cam;
    RenderTexture rt;
    Texture2D tex;
    int frame;
    string outDir;

    void Start()
    {
        cam = Camera.main;
        Time.captureFramerate = fps;
        rt = new RenderTexture(width, height, 24);
        tex = new Texture2D(width, height, TextureFormat.RGB24, false);
        outDir = Application.dataPath + "/../" + subDir;
        Directory.CreateDirectory(outDir);
        var cd = GameObject.Find("ChoreoDirector");
        if (cd != null) { var src = cd.GetComponent<AudioSource>(); if (src != null) src.mute = true; }
        frame = 0;
        PerfClock.T = 0f;
    }

    void Update()
    {
        // set the clock BEFORE directors' Update (execution order -100)
        PerfClock.T = (startFrame + frame) / (float)fps;
    }

    void LateUpdate()
    {
        if (frame >= totalFrames) return;
        var pT = cam.targetTexture; var pA = RenderTexture.active;
        cam.targetTexture = rt; cam.Render(); RenderTexture.active = rt;
        tex.ReadPixels(new Rect(0, 0, width, height), 0, 0); tex.Apply();
        cam.targetTexture = pT; RenderTexture.active = pA;
        File.WriteAllBytes(Path.Combine(outDir, string.Format("frame_{0:D5}.jpg", frame)), tex.EncodeToJPG(90));
        frame++;
        if (frame >= totalFrames)
        {
            Time.captureFramerate = 0;
            PerfClock.T = -1f;
            Debug.Log("[PlayCapture] DONE " + totalFrames + " frames -> " + outDir);
#if UNITY_EDITOR
            EditorApplication.isPlaying = false;
#endif
        }
    }
}
