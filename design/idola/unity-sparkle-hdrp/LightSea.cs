using UnityEngine;
using UnityEngine.Rendering.HighDefinition;

// HDRP version of the "Sparkle" audience light-sea: a vast field of tiny HDR points
// (phone lights) receding into volumetric haze, twinkling. HDRP/Unlit with an HDR
// _UnlitColor > 1 so Bloom blooms each point into a soft glow. Additive blend.
// PerfClock-driven for deterministic play-mode capture.
public class LightSea : MonoBehaviour
{
    public int count = 3200;
    public float xHalf = 48f, yMin = 0.4f, yMax = 30f, zNear = -9f, zFar = -64f;
    public float sizeMin = 0.06f, sizeMax = 0.22f, hdr = 4.2f;

    Transform[] pts;
    MeshRenderer[] rends;
    MaterialPropertyBlock mpb;
    float[] phase, freq, baseI, swayPh, swayAmp;
    Vector3[] basePos;
    Camera cam;
    static readonly int UnlitColor = Shader.PropertyToID("_UnlitColor");
    const int sparkleSeed = 8181;

    float T { get { return PerfClock.T >= 0f ? PerfClock.T : Time.time; } }

    void Start()
    {
        cam = Camera.main;
        var mat = new Material(Shader.Find("HDRP/Unlit"));
        mat.SetFloat("_SurfaceType", 1f);                 // Transparent
        mat.SetFloat("_BlendMode", 1f);                   // Additive
        mat.SetFloat("_SrcBlend", (float)UnityEngine.Rendering.BlendMode.SrcAlpha);
        mat.SetFloat("_DstBlend", (float)UnityEngine.Rendering.BlendMode.One);
        mat.SetFloat("_ZWrite", 0f);
        mat.SetFloat("_ZTestDepthEqualForOpaque", 4f);
        mat.SetColor("_UnlitColor", new Color(hdr, hdr, hdr * 1.05f, 1f));
        HDMaterial.ValidateMaterial(mat);                 // apply HDRP keyword/blend setup

        var mesh = Quad();
        var rng = new System.Random(sparkleSeed);
        pts = new Transform[count]; rends = new MeshRenderer[count];
        phase = new float[count]; freq = new float[count]; baseI = new float[count];
        swayPh = new float[count]; swayAmp = new float[count]; basePos = new Vector3[count];
        mpb = new MaterialPropertyBlock();

        for (int i = 0; i < count; i++)
        {
            var go = new GameObject("L" + i);
            go.transform.SetParent(transform, false);
            float fz = Mathf.Pow((float)rng.NextDouble(), 0.7f);         // denser toward far haze
            float z = Mathf.Lerp(zNear, zFar, fz);
            float x = ((float)rng.NextDouble() * 2f - 1f) * xHalf * (0.5f + 0.9f * fz);
            float y = Mathf.Lerp(yMin, yMax, Mathf.Pow((float)rng.NextDouble(), 0.85f)) * (0.4f + 0.9f * fz);
            go.transform.localPosition = new Vector3(x, y, z);
            float s = Mathf.Lerp(sizeMin, sizeMax, (float)rng.NextDouble()) * (0.7f + 1.1f * fz);
            go.transform.localScale = new Vector3(s, s, s);
            var mf = go.AddComponent<MeshFilter>(); mf.sharedMesh = mesh;
            var mr = go.AddComponent<MeshRenderer>();
            mr.sharedMaterial = mat;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            mr.receiveShadows = false;
            pts[i] = go.transform; rends[i] = mr;
            phase[i] = (float)(rng.NextDouble() * 6.28);
            freq[i] = 0.6f + 2.2f * (float)rng.NextDouble();
            baseI[i] = 0.55f + 0.55f * (float)rng.NextDouble();
            swayPh[i] = (float)(rng.NextDouble() * 6.28);
            swayAmp[i] = 0.05f + 0.16f * (float)rng.NextDouble(); // waving phone-light arm
            basePos[i] = go.transform.localPosition;
        }
    }

    void LateUpdate()
    {
        if (pts == null) return;
        if (cam == null) cam = Camera.main;
        float t = T;
        Vector3 cf = cam != null ? cam.transform.forward : Vector3.forward;
        Vector3 cu = cam != null ? cam.transform.up : Vector3.up;
        for (int i = 0; i < count; i++)
        {
            pts[i].rotation = Quaternion.LookRotation(cf, cu);
            // audience breathing: slow side-to-side wave of held-up lights + gentle bob
            float sx = Mathf.Sin(t * 0.9f + swayPh[i]) * swayAmp[i];
            float sy = Mathf.Sin(t * 1.3f + swayPh[i] * 1.7f) * swayAmp[i] * 0.35f;
            pts[i].localPosition = basePos[i] + new Vector3(sx, sy, 0f);
            float tw = 0.55f + 0.45f * Mathf.Sin(t * freq[i] + phase[i]);
            float inten = baseI[i] * hdr * (0.35f + 0.65f * tw * tw);
            mpb.SetColor(UnlitColor, new Color(inten, inten, inten * 1.05f, 1f));
            rends[i].SetPropertyBlock(mpb);
        }
    }

    static Mesh Quad()
    {
        var m = new Mesh();
        m.vertices = new Vector3[] { new Vector3(-0.5f,-0.5f,0), new Vector3(0.5f,-0.5f,0), new Vector3(0.5f,0.5f,0), new Vector3(-0.5f,0.5f,0) };
        m.uv = new Vector2[] { new Vector2(0,0), new Vector2(1,0), new Vector2(1,1), new Vector2(0,1) };
        m.triangles = new int[] { 0, 2, 1, 0, 3, 2 };
        m.RecalculateBounds();
        return m;
    }
}
