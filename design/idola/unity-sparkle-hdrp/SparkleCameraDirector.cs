using UnityEngine;

// Cinematic camera tour for the Sparkle instrumental stage (no performers). Slow, moody moves
// between the spotlit piano / mic / guitar, low floor-reflection glides, and wide light-sea shots.
// PerfClock-driven so it bakes into the deterministic capture.
[RequireComponent(typeof(Camera))]
public class SparkleCameraDirector : MonoBehaviour
{
    Camera cam;
    struct Shot { public float t0, t1; public Vector3 p0, p1, l0, l1; public float f0, f1; }
    Shot[] shots;

    static readonly Vector3 PIANO = new Vector3(-3.9f, 1.0f, -0.4f);
    static readonly Vector3 MIC = new Vector3(0.2f, 1.4f, 1.6f);
    static readonly Vector3 GTR = new Vector3(3.9f, 0.9f, -0.2f);

    float T { get { return PerfClock.T >= 0f ? PerfClock.T : Time.timeSinceLevelLoad; } }

    void Awake() { cam = GetComponent<Camera>(); Build(); }
    void Update() { Apply(T); }

    Shot S(float a, float b, Vector3 p0, Vector3 p1, Vector3 l0, Vector3 l1, float f0, float f1)
    { return new Shot { t0 = a, t1 = b, p0 = p0, p1 = p1, l0 = l0, l1 = l1, f0 = f0, f1 = f1 }; }

    void Build()
    {
        shots = new Shot[]
        {
            // establishing — whole stage + light sea
            S(0,8,   new Vector3(0,2.2f,11.5f), new Vector3(0,1.9f,9.3f),  new Vector3(0,1.3f,-1f), new Vector3(0,1.3f,-1f), 42,40),
            // slow push to the piano
            S(8,16,  new Vector3(-0.8f,1.7f,6.5f), new Vector3(-2.7f,1.35f,3.4f), PIANO, PIANO, 40,33),
            // low floor-reflection glide toward the mic
            S(16,24, new Vector3(0.2f,0.45f,6.0f), new Vector3(0.2f,0.7f,3.9f), MIC, MIC, 38,33),
            // crane over to the guitar
            S(24,32, new Vector3(1.8f,2.2f,6.5f), new Vector3(3.0f,1.25f,3.0f), GTR, GTR, 40,33),
            // wide with all three beams + sea
            S(32,40, new Vector3(0,3.4f,10.5f), new Vector3(0,2.7f,8.2f), new Vector3(0,2.6f,-3f), new Vector3(0,2.6f,-3f), 47,43),
            // intimate mic with the light sea behind
            S(40,48, new Vector3(0.2f,1.6f,4.4f), new Vector3(0.2f,1.5f,3.5f), MIC, MIC, 33,30),
            // low reflection dolly across the glossy floor
            S(48,56, new Vector3(-3.2f,0.4f,7.0f), new Vector3(3.2f,0.5f,7.0f), new Vector3(0,0.7f,-0.5f), new Vector3(0,0.7f,-0.5f), 44,44),
            // rising crane finale — reveal the whole light sea
            S(56,66, new Vector3(0,1.8f,8.5f), new Vector3(0,5.2f,12.5f), new Vector3(0,2.0f,-5f), new Vector3(0,3.0f,-8f), 42,52),
        };
    }

    int Index(float t) { for (int i=0;i<shots.Length;i++) if (t>=shots[i].t0 && t<shots[i].t1) return i; return t>=shots[shots.Length-1].t1 ? shots.Length-1 : 0; }

    void Apply(float t)
    {
        if (cam == null) cam = GetComponent<Camera>();
        var s = shots[Index(t)];
        float e = Mathf.Clamp01((t - s.t0) / Mathf.Max(0.001f, s.t1 - s.t0));
        e = e*e*(3f-2f*e); // smoothstep
        Vector3 pos = Vector3.Lerp(s.p0, s.p1, e);
        Vector3 look = Vector3.Lerp(s.l0, s.l1, e);
        cam.transform.position = pos;
        var dir = (look - pos); if (dir.sqrMagnitude < 1e-5f) dir = Vector3.forward;
        cam.transform.rotation = Quaternion.LookRotation(dir.normalized, Vector3.up);
        cam.fieldOfView = Mathf.Lerp(s.f0, s.f1, e);
    }

    public void EvaluateAtTime(float t) { if (shots==null) Build(); Apply(t); }
}
