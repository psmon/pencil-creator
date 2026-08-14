using UnityEngine;

// Near-field audience: rows of dark human silhouettes (head+shoulders) close to the stage
// front, each holding up a tiny HDR phone-light. Reads as a dense crowd hugging the stage,
// silhouetted against the far light-sea. Deterministic twinkle/bob (PerfClock-driven).
public class CrowdSilhouette : MonoBehaviour
{
    public int count = 420;
    public float xHalf = 15f, zNear = -0.4f, zFar = -11f;
    public float phoneHdr = 4.0f;

    Transform[] phone; MeshRenderer[] pr; MaterialPropertyBlock mpb;
    float[] ph, freq, bob; Transform[] body; Vector3[] phoneBase;
    static readonly int UnlitColor = Shader.PropertyToID("_UnlitColor");
    const int seed = 909;
    float T { get { return PerfClock.T >= 0f ? PerfClock.T : Time.time; } }

    void Start()
    {
        var bodyMat = new Material(Shader.Find("HDRP/Lit"));
        bodyMat.SetColor("_BaseColor", new Color(0.015f,0.015f,0.02f,1f));
        bodyMat.SetFloat("_Smoothness", 0.1f); bodyMat.SetFloat("_Metallic", 0f);
        UnityEngine.Rendering.HighDefinition.HDMaterial.ValidateMaterial(bodyMat);

        var dotMat = new Material(Shader.Find("HDRP/Unlit"));
        dotMat.SetFloat("_SurfaceType",1f); dotMat.SetFloat("_BlendMode",1f);
        dotMat.SetFloat("_SrcBlend",(float)UnityEngine.Rendering.BlendMode.SrcAlpha);
        dotMat.SetFloat("_DstBlend",(float)UnityEngine.Rendering.BlendMode.One);
        dotMat.SetFloat("_ZWrite",0f);
        dotMat.SetColor("_UnlitColor", new Color(phoneHdr,phoneHdr,phoneHdr,1f));
        UnityEngine.Rendering.HighDefinition.HDMaterial.ValidateMaterial(dotMat);
        var quad = Quad();

        var rng = new System.Random(seed);
        phone=new Transform[count]; pr=new MeshRenderer[count]; body=new Transform[count];
        ph=new float[count]; freq=new float[count]; bob=new float[count]; phoneBase=new Vector3[count];
        mpb=new MaterialPropertyBlock();

        for (int i=0;i<count;i++)
        {
            float fz=(float)rng.NextDouble();
            float z=Mathf.Lerp(zNear,zFar,fz);
            float x=((float)rng.NextDouble()*2f-1f)*xHalf*(0.6f+0.6f*fz);
            float h=0.9f+0.5f*(float)rng.NextDouble();       // person height
            // body (dark capsule)
            var b=GameObject.CreatePrimitive(PrimitiveType.Capsule);
            var col=b.GetComponent<Collider>(); if(col) Destroy(col);
            b.name="C"+i; b.transform.SetParent(transform,false);
            b.transform.localPosition=new Vector3(x,h*0.5f,z);
            b.transform.localScale=new Vector3(0.32f,h*0.5f,0.32f);
            b.GetComponent<MeshRenderer>().sharedMaterial=bodyMat;
            b.GetComponent<MeshRenderer>().shadowCastingMode=UnityEngine.Rendering.ShadowCastingMode.Off;
            body[i]=b.transform;
            // phone dot (only ~70% hold one)
            var d=new GameObject("P"+i); d.transform.SetParent(transform,false);
            float held = (float)rng.NextDouble()<0.72 ? 1f : 0f;
            d.transform.localPosition=new Vector3(x+((float)rng.NextDouble()-0.5f)*0.2f, h+0.25f, z);
            float ds=0.06f+0.05f*(float)rng.NextDouble();
            d.transform.localScale=new Vector3(ds,ds,ds)*held;
            var mf=d.AddComponent<MeshFilter>(); mf.sharedMesh=quad;
            var mr=d.AddComponent<MeshRenderer>(); mr.sharedMaterial=dotMat;
            mr.shadowCastingMode=UnityEngine.Rendering.ShadowCastingMode.Off; mr.receiveShadows=false;
            phone[i]=d.transform; pr[i]=mr; phoneBase[i]=d.transform.localPosition;
            ph[i]=(float)rng.NextDouble()*6.28f; freq[i]=0.5f+1.8f*(float)rng.NextDouble(); bob[i]=(float)rng.NextDouble()*6.28f;
        }
    }

    void LateUpdate()
    {
        if (phone==null) return;
        var cam=Camera.main; Vector3 cf=cam!=null?cam.transform.forward:Vector3.forward;
        Vector3 look=new Vector3(cf.x,0,cf.z); if(look.sqrMagnitude<1e-4f) look=Vector3.forward;
        var rot=Quaternion.LookRotation(look.normalized,Vector3.up);
        float t=T;
        for (int i=0;i<count;i++)
        {
            phone[i].rotation=rot;
            // waving cheer-light: side-to-side arc + slight lift, like arms swaying to the song
            float wx=Mathf.Sin(t*0.85f+bob[i])* (0.12f+0.1f*Mathf.Sin(bob[i]*2f));
            float wy=Mathf.Abs(Mathf.Sin(t*0.85f+bob[i]))*0.06f;
            phone[i].localPosition=phoneBase[i]+new Vector3(wx,wy,0f);
            float tw=0.6f+0.4f*Mathf.Sin(t*freq[i]+ph[i]);
            float inten=phoneHdr*tw;
            mpb.SetColor(UnlitColor,new Color(inten,inten,inten,1f));
            pr[i].SetPropertyBlock(mpb);
            // subtle body sway (breathing crowd)
            float sway=Mathf.Sin(t*1.5f+bob[i])*0.03f;
            body[i].localRotation=Quaternion.Euler(0,0,sway*20f);
        }
    }

    static Mesh Quad(){var m=new Mesh();m.vertices=new Vector3[]{new Vector3(-0.5f,-0.5f,0),new Vector3(0.5f,-0.5f,0),new Vector3(0.5f,0.5f,0),new Vector3(-0.5f,0.5f,0)};m.uv=new Vector2[]{new Vector2(0,0),new Vector2(1,0),new Vector2(1,1),new Vector2(0,1)};m.triangles=new int[]{0,2,1,0,3,2};m.RecalculateBounds();return m;}
}
