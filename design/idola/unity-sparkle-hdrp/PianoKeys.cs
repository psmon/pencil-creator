using UnityEngine;
using System.Collections.Generic;

// Procedural piano keyboard that REACTS to the pianist's fingers.
// Replaces the flat "Keys" slab with individual keys; every frame each fingertip bone of the
// Performer is tested against the keys (simple proximity check) and touched keys dip/tilt
// like real piano keys. Deterministic — driven purely by the sampled animation pose.
public class PianoKeys : MonoBehaviour
{
    public int keyCount = 30;
    public float pressDepth = 0.022f;
    public float pressTilt = 5.5f;      // degrees around the back edge
    public float reach = 0.055f;        // fingertip-to-key horizontal reach
    public float speed = 14f;           // press/release lerp speed

    Transform[] keys; Vector3[] rest; float[] press;
    float keyTopY, keyZ, keyHalfZ, halfW;
    List<Transform> tips = new List<Transform>();

    void Start()
    {
        // find the flat slab to replace
        var gp = GameObject.Find("GrandPiano"); if (gp==null){ enabled=false; return; }
        Transform slab=null; foreach (Transform t in gp.transform) if (t.name=="Keys") slab=t;
        if (slab==null){ enabled=false; return; }
        Vector3 c=slab.position, s=slab.localScale;
        slab.gameObject.SetActive(false);

        var white = new Material(Shader.Find("HDRP/Lit"));
        white.SetColor("_BaseColor", new Color(0.42f,0.42f,0.40f,1f));
        white.SetFloat("_Smoothness",0.4f);
        UnityEngine.Rendering.HighDefinition.HDMaterial.ValidateMaterial(white);
        var dark = new Material(Shader.Find("HDRP/Lit"));
        dark.SetColor("_BaseColor", new Color(0.06f,0.06f,0.07f,1f));
        dark.SetFloat("_Smoothness",0.5f);
        UnityEngine.Rendering.HighDefinition.HDMaterial.ValidateMaterial(dark);

        keyTopY=c.y; keyZ=c.z; keyHalfZ=s.z*0.5f;
        float span=s.x, w=span/keyCount; halfW=w*0.5f;
        keys=new Transform[keyCount]; rest=new Vector3[keyCount]; press=new float[keyCount];
        for (int i=0;i<keyCount;i++)
        {
            var k=GameObject.CreatePrimitive(PrimitiveType.Cube);
            var col=k.GetComponent<Collider>(); if(col) Destroy(col);
            k.name="PK"+i; k.transform.SetParent(gp.transform,true);
            float x=c.x-span*0.5f+w*(i+0.5f);
            k.transform.position=new Vector3(x, c.y, c.z);
            k.transform.localScale=new Vector3(w*0.86f, s.y, s.z*0.96f);
            // every 2nd/3rd key darker to suggest black keys pattern
            bool blackish=(i%7==1||i%7==3||i%7==4);
            k.GetComponent<MeshRenderer>().sharedMaterial = blackish?dark:white;
            k.GetComponent<MeshRenderer>().shadowCastingMode=UnityEngine.Rendering.ShadowCastingMode.Off;
            keys[i]=k.transform; rest[i]=k.transform.position;
        }

        // collect fingertip bones from the Performer
        var perf=GameObject.Find("Performer");
        var anim=perf!=null?perf.GetComponent<Animator>():null;
        if (anim!=null)
        {
            HumanBodyBones[] cand = {
                HumanBodyBones.LeftThumbDistal, HumanBodyBones.LeftIndexDistal, HumanBodyBones.LeftMiddleDistal,
                HumanBodyBones.LeftRingDistal, HumanBodyBones.LeftLittleDistal,
                HumanBodyBones.RightThumbDistal, HumanBodyBones.RightIndexDistal, HumanBodyBones.RightMiddleDistal,
                HumanBodyBones.RightRingDistal, HumanBodyBones.RightLittleDistal,
                HumanBodyBones.LeftHand, HumanBodyBones.RightHand };
            foreach (var b in cand){ var t=anim.GetBoneTransform(b); if (t!=null) tips.Add(t); }
        }
    }

    void LateUpdate()
    {
        if (keys==null) return;
        for (int i=0;i<keyCount;i++)
        {
            bool hit=false;
            for (int f=0;f<tips.Count;f++)
            {
                Vector3 p=tips[f].position;
                if (Mathf.Abs(p.x-rest[i].x)<=halfW+reach*0.4f &&
                    Mathf.Abs(p.z-keyZ)<=keyHalfZ+reach &&
                    p.y>keyTopY-0.06f && p.y<keyTopY+reach) { hit=true; break; }
            }
            press[i]=Mathf.MoveTowards(press[i], hit?1f:0f, Time.deltaTime*speed);
            float e=press[i]*press[i]*(3f-2f*press[i]);
            keys[i].position=rest[i]+new Vector3(0,-pressDepth*e,0);
            keys[i].localRotation=Quaternion.Euler(-pressTilt*e,0,0);
        }
    }
}
