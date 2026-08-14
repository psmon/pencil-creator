using UnityEngine;

// Over-the-shoulder, handheld live-performance camera for the Sparkle recreation.
// Sits behind the performer (who faces -Z toward the audience light-sea) and looks past
// the shoulder into the sea of phone lights. Slow dollies + subtle handheld shake.
// PerfClock-driven for deterministic capture.
[RequireComponent(typeof(Camera))]
public class PerfCam : MonoBehaviour
{
    public bool dance = false;   // true = dance-stage coverage (front-facing group shots)
    Camera cam;
    struct Shot { public float t0,t1; public Vector3 p0,p1,l0,l1; public float f0,f1,shake; }
    Shot[] shots;

    float T { get { return PerfClock.T >= 0f ? PerfClock.T : Time.timeSinceLevelLoad; } }

    void Awake(){ cam = GetComponent<Camera>(); Build(); }
    void Update(){ Apply(T); }

    Shot S(float a,float b,Vector3 p0,Vector3 p1,Vector3 l0,Vector3 l1,float f0,float f1,float sh)
    { return new Shot{t0=a,t1=b,p0=p0,p1=p1,l0=l0,l1=l1,f0=f0,f1=f1,shake=sh}; }

    void Build()
    {
        // SEATED pianist: head ~(0,1.6,2.3), hands on keys ~(0.1,1.12,2.0), facing -Z.
        // Sea of phone-lights at -Z. 12-shot, 104s varied coverage: drone orbits, aerials,
        // in-crowd POV, and MORE performer time (OTS / profile / hands).
        Vector3 head = new Vector3(0f,1.5f,2.3f);
        Vector3 keys = new Vector3(0.1f,1.12f,2.0f);

        if (dance)
        {
            // DANCE coverage — group at x±2, z 1.6(leads)/3.3(backups), facing -Z (audience side).
            Vector3 G = new Vector3(0f,1.25f,2.0f);
            shots = new Shot[]
            {
                // 0 front high wide — whole formation + sea behind them
                S(0,8,    new Vector3(0f,3.3f,-6.6f), new Vector3(0f,2.8f,-5.2f), G, G, 51,48, 0.7f),
                // 1 front dolly-in to the lead line
                S(8,16,   new Vector3(0f,2.05f,-4.8f), new Vector3(0f,1.9f,-3.1f), new Vector3(0f,1.25f,1.9f), new Vector3(0f,1.3f,1.8f), 46,42, 0.8f),
                // 2 front lateral truck across the line (above crowd heads)
                S(16,24,  new Vector3(-3.2f,1.98f,-2.6f), new Vector3(3.2f,1.98f,-2.6f), G, G, 46,46, 0.9f),
                // 3 tight on the center leads
                S(24,32,  new Vector3(0.95f,1.85f,-1.3f), new Vector3(-0.95f,1.8f,-1.3f), new Vector3(0f,1.35f,1.7f), new Vector3(0f,1.35f,1.7f), 38,38, 0.8f),
                // 4 side orbit right
                S(32,40,  new Vector3(4.6f,2.2f,0.2f), new Vector3(3.3f,2.1f,-2.7f), G, G, 45,44, 0.8f),
                // 5 over-crowd POV toward the stage
                S(40,48,  new Vector3(2.4f,2.75f,-7.6f), new Vector3(-1.1f,2.5f,-5.8f), G, G, 44,41, 1.0f),
                // 6 behind the dancers — silhouettes vs the light sea
                S(48,56,  new Vector3(0.4f,2.0f,5.3f), new Vector3(0f,1.95f,4.4f), new Vector3(0f,1.2f,-4f), new Vector3(0f,1.2f,-4f), 48,46, 0.7f),
                // 7 floor-level front, tilt up through the footlight glow
                S(56,64,  new Vector3(1.25f,0.45f,0.1f), new Vector3(-1.25f,0.45f,0.1f), new Vector3(0f,1.5f,1.95f), new Vector3(0f,1.5f,1.95f), 44,44, 0.8f),
                // 8 high aerial sweep over the stage toward the sea
                S(64,72,  new Vector3(0.3f,7.8f,3.2f), new Vector3(-0.3f,8.6f,0.2f), new Vector3(0f,0.6f,-9f), new Vector3(0f,0.4f,-12f), 54,57, 0.6f),
                // 9 diagonal crane down, front-left
                S(72,80,  new Vector3(-3.6f,3.4f,-3.4f), new Vector3(-1.8f,2.2f,-2.0f), G, G, 47,45, 0.8f),
                // 10 drifting two-shot on the right leads
                S(80,89,  new Vector3(1.7f,1.78f,-0.7f), new Vector3(2.3f,1.72f,0.6f), new Vector3(1.1f,1.3f,1.7f), new Vector3(1.2f,1.3f,1.7f), 40,39, 0.8f),
                // 11 rising crane finale behind the group
                S(89,104, new Vector3(0f,2.2f,5.6f), new Vector3(0f,5.8f,11.0f), new Vector3(0f,1.4f,-8f), new Vector3(0f,3.0f,-15f), 48,58, 0.7f),
            };
            return;
        }

        shots = new Shot[]
        {
            // 0 high drone hover, slow drift — whole cosmos
            S(0,8,    new Vector3(0.5f,5.2f,9.2f), new Vector3(-0.4f,4.8f,8.2f), new Vector3(0f,2.3f,-14f), new Vector3(0f,2.2f,-14f), 58,56, 0.7f),
            // 1 drone descend + push through the sparks toward the stage
            S(8,16,   new Vector3(-0.3f,3.8f,7.6f), new Vector3(0.2f,2.3f,5.0f), new Vector3(0f,1.6f,-8f), new Vector3(0f,1.4f,-6f), 54,48, 0.9f),
            // 2 OTS right shoulder — performer + keys + sea (long)
            S(16,25,  new Vector3(0.52f,1.94f,3.65f), new Vector3(0.4f,1.86f,3.15f), new Vector3(0f,1.12f,1.1f), new Vector3(0.05f,1.1f,1.3f), 46,43, 0.7f),
            // 3 side profile close — face/body at the piano (performer)
            S(25,33,  new Vector3(2.2f,1.6f,1.6f), new Vector3(1.8f,1.55f,2.1f), new Vector3(0.1f,1.42f,2.25f), new Vector3(0.1f,1.4f,2.25f), 42,39, 0.8f),
            // 4 over-the-crowd POV — gliding above the silhouette heads toward the stage
            S(33,41,  new Vector3(2.4f,2.75f,-7.6f), new Vector3(1.1f,2.5f,-5.8f), head, head, 44,41, 1.0f),
            // 5 drone orbit L→C around the performer
            S(41,48,  new Vector3(-4.6f,2.6f,4.4f), new Vector3(-1.2f,2.3f,5.6f), head, head, 47,45, 0.8f),
            // 6 drone orbit C→R continuing the arc
            S(48,55,  new Vector3(-1.2f,2.3f,5.6f), new Vector3(4.4f,2.7f,4.2f), head, head, 45,47, 0.8f),
            // 7 hands & keys low close — playing detail (performer)
            S(55,63,  new Vector3(0.75f,1.42f,2.95f), new Vector3(0.2f,1.38f,2.85f), keys, keys, 39,37, 0.7f),
            // 8 high aerial — sweeping over the stage: pianist below, glowing sea + spark rain ahead
            S(63,71,  new Vector3(0.3f,7.8f,3.2f), new Vector3(-0.3f,8.6f,0.2f), new Vector3(0f,0.6f,-9f), new Vector3(0f,0.4f,-12f), 54,57, 0.6f),
            // 9 low lateral glide through the sparks + crowd
            S(71,79,  new Vector3(-4.2f,1.25f,4.2f), new Vector3(4.2f,1.35f,4.2f), new Vector3(0f,1.7f,-7f), new Vector3(0f,1.7f,-7f), 52,52, 1.0f),
            // 10 front-right low across the piano — performer face-on, sparks drifting behind
            S(79,89,  new Vector3(2.5f,1.45f,-0.9f), new Vector3(1.9f,1.5f,-0.2f), head, head, 43,40, 0.8f),
            // 11 behind-performer rise into the crane finale — silhouette vs the sea
            S(89,104, new Vector3(0.05f,1.95f,4.6f), new Vector3(0f,5.8f,11.0f), new Vector3(0f,1.3f,-8f), new Vector3(0f,3.0f,-15f), 48,58, 0.7f),
        };
    }

    int Idx(float t){ for(int i=0;i<shots.Length;i++) if(t>=shots[i].t0&&t<shots[i].t1) return i; return shots.Length-1; }

    void Apply(float t)
    {
        if (cam==null) cam=GetComponent<Camera>();
        // loop the schedule for previews/songs longer than the schedule
        float span = shots[shots.Length-1].t1;
        float tt = span>0 ? Mathf.Repeat(t, span) : t;
        var s = shots[Idx(tt)];
        float e = Mathf.Clamp01((tt - s.t0)/Mathf.Max(0.001f, s.t1-s.t0));
        float es = e*e*(3f-2f*e);
        Vector3 pos = Vector3.Lerp(s.p0,s.p1,es);
        Vector3 look = Vector3.Lerp(s.l0,s.l1,es);

        // handheld shake — layered perlin noise
        float k = s.shake;
        float nx = (Mathf.PerlinNoise(t*1.1f, 3.3f)-0.5f);
        float ny = (Mathf.PerlinNoise(t*1.4f, 7.7f)-0.5f);
        float nz = (Mathf.PerlinNoise(t*0.7f, 11.1f)-0.5f);
        pos += new Vector3(nx*0.05f, ny*0.04f, nz*0.03f)*k;
        cam.transform.position = pos;
        Vector3 dir = (look - pos); if (dir.sqrMagnitude<1e-5f) dir=Vector3.forward;
        Quaternion rot = Quaternion.LookRotation(dir.normalized, Vector3.up);
        float rnx=(Mathf.PerlinNoise(t*1.3f,21f)-0.5f), rny=(Mathf.PerlinNoise(t*1.6f,31f)-0.5f);
        rot *= Quaternion.Euler(rnx*0.7f*k, rny*0.7f*k, (Mathf.PerlinNoise(t*0.9f,41f)-0.5f)*0.5f*k);
        cam.transform.rotation = rot;
        cam.fieldOfView = Mathf.Lerp(s.f0,s.f1,es);
    }
}
