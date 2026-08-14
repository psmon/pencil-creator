using UnityEngine;

// Over-the-shoulder, handheld live-performance camera for the Sparkle recreation.
// Sits behind the performer (who faces -Z toward the audience light-sea) and looks past
// the shoulder into the sea of phone lights. Slow dollies + subtle handheld shake.
// PerfClock-driven for deterministic capture.
[RequireComponent(typeof(Camera))]
public class PerfCam : MonoBehaviour
{
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
        // SEATED pianist: head ~(0,1.65,2.28), hands on keys ~(0.1,1.15,2.0), facing -Z.
        // Sea of phone-lights at -Z. Handheld live-performance coverage.
        Vector3 sea = new Vector3(0f, 0.9f, -11f);
        shots = new Shot[]
        {
            // 0 HIGH WIDE establishing — whole spectacle: crowd + falling sparks + pillars
            S(0,8,   new Vector3(0.5f,5.2f,9.2f), new Vector3(0.3f,4.6f,7.8f), new Vector3(0f,2.4f,-14f), new Vector3(0f,2.2f,-14f), 60,57, 0.8f),
            // 1 descend + push toward the stage through the sparks
            S(8,15,  new Vector3(0.3f,3.6f,7.4f), new Vector3(0.2f,2.5f,5.3f), new Vector3(0f,1.6f,-8f), new Vector3(0f,1.5f,-8f), 54,49, 0.9f),
            // 2 OTS performer — brief: pianist + keys + sparks/crowd beyond
            S(15,22, new Vector3(0.5f,1.92f,3.6f), new Vector3(0.44f,1.86f,3.2f), new Vector3(0f,1.12f,1.1f), new Vector3(0f,1.12f,1.1f), 46,44, 0.7f),
            // 3 low lateral glide sweeping the falling sparks + crowd
            S(22,30, new Vector3(-4.2f,1.25f,4.2f), new Vector3(4.2f,1.35f,4.2f), new Vector3(0f,1.7f,-7f), new Vector3(0f,1.7f,-7f), 52,52, 1.0f),
            // 4 overhead looking down — pianist + crowd sea + sparks
            S(30,38, new Vector3(0.1f,6.6f,3.8f), new Vector3(0.1f,6.1f,1.6f), new Vector3(0f,0.4f,-3f), new Vector3(0f,0.6f,-4f), 56,54, 0.7f),
            // 5 rising crane finale — reveal the whole cosmos of light
            S(38,48, new Vector3(0f,2.4f,7.2f), new Vector3(0f,5.6f,11.5f), new Vector3(0f,2.0f,-12f), new Vector3(0f,3.2f,-15f), 50,58, 0.7f),
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
