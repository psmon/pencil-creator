using UnityEngine;

// The signature "Sparkle" device: curtains of bright HDR sparkle streaks raining DOWN
// around/behind the stage (like cold-spark fountains / kinetic light rain). Additive HDR so
// Bloom blooms them into starlight. Deterministic (PerfClock-driven) for play-mode capture.
public class FallingSparks : MonoBehaviour
{
    public int count = 1500;
    public float xHalf = 26f, zNear = -2f, zFar = -30f;
    public float yTop = 13f, yBottom = -0.5f;
    public float sizeMin = 0.03f, sizeMax = 0.09f, streak = 7f, hdr = 5.5f;
    public float fallMin = 2.0f, fallMax = 5.5f;
    // 연출: startTime 이전엔 스파클 없음, 이후 rampIn 초 동안 쏟아지듯 페이드인.
    // 1부: startTime=30 (30초 이후 쏟아짐). 2부: startTime=0 (이어서 계속).
    public float startTime = 0f;
    public float rampIn = 2.5f;

    Transform[] pts; MeshRenderer[] rends; MaterialPropertyBlock mpb;
    float[] px, pz, phase, speed, baseI, size;
    Camera cam;
    static readonly int UnlitColor = Shader.PropertyToID("_UnlitColor");
    const int seed = 4242;
    float span;

    float T { get { return PerfClock.T >= 0f ? PerfClock.T : Time.time; } }

    void Start()
    {
        cam = Camera.main;
        var mat = new Material(Shader.Find("HDRP/Unlit"));
        mat.SetFloat("_SurfaceType", 1f); mat.SetFloat("_BlendMode", 1f);
        mat.SetFloat("_SrcBlend", (float)UnityEngine.Rendering.BlendMode.SrcAlpha);
        mat.SetFloat("_DstBlend", (float)UnityEngine.Rendering.BlendMode.One);
        mat.SetFloat("_ZWrite", 0f);
        mat.SetColor("_UnlitColor", new Color(hdr,hdr,hdr,1f));
        UnityEngine.Rendering.HighDefinition.HDMaterial.ValidateMaterial(mat);

        var mesh = Quad();
        var rng = new System.Random(seed);
        span = yTop - yBottom;
        pts=new Transform[count]; rends=new MeshRenderer[count]; mpb=new MaterialPropertyBlock();
        px=new float[count]; pz=new float[count]; phase=new float[count]; speed=new float[count]; baseI=new float[count]; size=new float[count];
        for (int i=0;i<count;i++)
        {
            var go=new GameObject("S"+i); go.transform.SetParent(transform,false);
            float fz=(float)rng.NextDouble();
            pz[i]=Mathf.Lerp(zNear,zFar,fz);
            px[i]=((float)rng.NextDouble()*2f-1f)*xHalf*(0.6f+0.7f*fz);
            phase[i]=(float)rng.NextDouble()*span;
            speed[i]=Mathf.Lerp(fallMin,fallMax,(float)rng.NextDouble());
            baseI[i]=0.5f+0.6f*(float)rng.NextDouble();
            size[i]=Mathf.Lerp(sizeMin,sizeMax,(float)rng.NextDouble());
            var mf=go.AddComponent<MeshFilter>(); mf.sharedMesh=mesh;
            var mr=go.AddComponent<MeshRenderer>(); mr.sharedMaterial=mat;
            mr.shadowCastingMode=UnityEngine.Rendering.ShadowCastingMode.Off; mr.receiveShadows=false;
            pts[i]=go.transform; rends[i]=mr;
        }
    }

    void LateUpdate()
    {
        if (pts==null) return;
        if (cam==null) cam=Camera.main;
        float t=T;
        // startTime 지연: 이전엔 ramp=0(비가시), 이후 rampIn 초에 걸쳐 쏟아지듯 등장
        float ts = t - startTime;
        bool active = ts >= 0f;
        float ramp = active ? Mathf.Clamp01(ts / Mathf.Max(0.01f, rampIn)) : 0f;
        float tf = active ? ts : 0f;
        Vector3 cf = cam!=null?cam.transform.forward:Vector3.forward;
        for (int i=0;i<count;i++)
        {
            float y = yTop - Mathf.Repeat(tf*speed[i] + phase[i], span);
            pts[i].position = new Vector3(px[i], y, pz[i]);
            // face camera in yaw but keep vertical streak
            Vector3 look = new Vector3(cf.x,0f,cf.z); if (look.sqrMagnitude<1e-4f) look=Vector3.forward;
            pts[i].rotation = Quaternion.LookRotation(look.normalized, Vector3.up);
            pts[i].localScale = new Vector3(size[i], size[i]*streak, size[i]);
            // twinkle + fade near the bottom
            float fade = Mathf.Clamp01((y - yBottom)/2.0f);
            float tw = 0.6f+0.4f*Mathf.Sin(t*6f+phase[i]*3f);
            float inten = baseI[i]*hdr*tw*fade*ramp;
            mpb.SetColor(UnlitColor, new Color(inten,inten,inten*1.02f,1f));
            rends[i].SetPropertyBlock(mpb);
        }
    }

    static Mesh Quad()
    {
        var m=new Mesh();
        m.vertices=new Vector3[]{new Vector3(-0.5f,-0.5f,0),new Vector3(0.5f,-0.5f,0),new Vector3(0.5f,0.5f,0),new Vector3(-0.5f,0.5f,0)};
        m.uv=new Vector2[]{new Vector2(0,0),new Vector2(1,0),new Vector2(1,1),new Vector2(0,1)};
        m.triangles=new int[]{0,2,1,0,3,2}; m.RecalculateBounds(); return m;
    }
}
