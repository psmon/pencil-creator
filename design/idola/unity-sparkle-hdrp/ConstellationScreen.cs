using UnityEngine;

// 무대 뒤 '대형 스크린' 별자리 백라이트. 관객 시점에서 연주자 뒤를 은은히 채워 실루엣을 띄운다.
// 정적 별점(HDR 발광) + 일부 밝은 별자리 앵커 + PerfClock 트윙클. 카메라 빌보드로 항상 보임.
public class ConstellationScreen : MonoBehaviour
{
    public int stars = 420;
    public float width = 20f, height = 11f;   // 스크린 크기
    public float zPos = 9.6f, yBase = 0.4f;   // 무대 뒤(+z), 바닥부터
    public float hdr = 2.2f;                   // 은은한 백라이트(폰라이트보다 낮게)
    public float bigHdr = 4.6f;                // 별자리 앵커(밝은 별)
    public int bigStars = 46;
    public float sizeMin = 0.05f, sizeMax = 0.15f, bigSize = 0.26f;

    Transform[] pts; MeshRenderer[] rends; MaterialPropertyBlock mpb;
    float[] phase, baseI; Camera cam;
    static readonly int UnlitColor = Shader.PropertyToID("_UnlitColor");
    const int seed = 7788;

    float T { get { return PerfClock.T >= 0f ? PerfClock.T : Time.time; } }

    void Start()
    {
        cam = Camera.main;
        var mat = new Material(Shader.Find("HDRP/Unlit"));
        mat.SetFloat("_SurfaceType", 1f); mat.SetFloat("_BlendMode", 1f);
        mat.SetFloat("_SrcBlend", (float)UnityEngine.Rendering.BlendMode.SrcAlpha);
        mat.SetFloat("_DstBlend", (float)UnityEngine.Rendering.BlendMode.One);
        mat.SetFloat("_ZWrite", 0f);
        mat.SetColor("_UnlitColor", new Color(hdr, hdr, hdr, 1f));
        UnityEngine.Rendering.HighDefinition.HDMaterial.ValidateMaterial(mat);

        var mesh = Quad();
        var rng = new System.Random(seed);
        pts = new Transform[stars]; rends = new MeshRenderer[stars]; mpb = new MaterialPropertyBlock();
        phase = new float[stars]; baseI = new float[stars];
        for (int i = 0; i < stars; i++)
        {
            bool big = i < bigStars;
            float x = ((float)rng.NextDouble() * 2f - 1f) * width * 0.5f;
            float y = yBase + (float)rng.NextDouble() * height;
            float s = big ? bigSize * (0.7f + 0.6f * (float)rng.NextDouble())
                          : Mathf.Lerp(sizeMin, sizeMax, (float)rng.NextDouble());
            var go = new GameObject("C" + i); go.transform.SetParent(transform, false);
            go.transform.position = new Vector3(x, y, zPos);
            go.transform.localScale = new Vector3(s, s, s);
            var mf = go.AddComponent<MeshFilter>(); mf.sharedMesh = mesh;
            var mr = go.AddComponent<MeshRenderer>(); mr.sharedMaterial = mat;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off; mr.receiveShadows = false;
            phase[i] = (float)rng.NextDouble() * 6.28f;
            baseI[i] = (big ? bigHdr : hdr) * (0.6f + 0.6f * (float)rng.NextDouble());
            pts[i] = go.transform; rends[i] = mr;
        }
    }

    void LateUpdate()
    {
        if (pts == null) return;
        if (cam == null) cam = Camera.main;
        float t = T;
        Vector3 cf = cam != null ? cam.transform.forward : Vector3.forward;
        Vector3 look = new Vector3(cf.x, cf.y, cf.z); if (look.sqrMagnitude < 1e-4f) look = Vector3.forward;
        var rot = Quaternion.LookRotation(look.normalized, Vector3.up);
        for (int i = 0; i < stars; i++)
        {
            pts[i].rotation = rot;   // 카메라 빌보드
            float tw = 0.72f + 0.28f * Mathf.Sin(t * 2.4f + phase[i]);
            float inten = baseI[i] * tw;
            mpb.SetColor(UnlitColor, new Color(inten, inten, inten * 1.05f, 1f));
            rends[i].SetPropertyBlock(mpb);
        }
    }

    static Mesh Quad()
    {
        var m = new Mesh();
        m.vertices = new Vector3[] { new Vector3(-0.5f,-0.5f,0), new Vector3(0.5f,-0.5f,0), new Vector3(0.5f,0.5f,0), new Vector3(-0.5f,0.5f,0) };
        m.uv = new Vector2[] { new Vector2(0,0), new Vector2(1,0), new Vector2(1,1), new Vector2(0,1) };
        m.triangles = new int[] { 0,2,1,0,3,2 }; m.RecalculateBounds(); return m;
    }
}
