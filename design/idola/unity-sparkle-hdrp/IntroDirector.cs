using UnityEngine;
using UnityEngine.Rendering.HighDefinition;

// Second-edition intro: the show starts in TOTAL darkness. The two LED pillars ignite first
// (faint silhouette appears via the rim spots synced to them), then the audience lights breathe
// in, then the falling-star curtain begins. All PerfClock-driven (deterministic capture).
//   0.0-1.2s  pure black
//   1.2-4.0s  pillars fade in + rim spots (silhouette emerges)
//   3.5-7.0s  audience phone-lights fade in (far sea + near crowd)
//   5.0-8.0s  front key light (whisper)
//   6.0-10.0s falling sparks ramp to full — the sky starts to rain stars
[DefaultExecutionOrder(-50)]
public class IntroDirector : MonoBehaviour
{
    LightSea sea; FallingSparks sparks; CrowdSilhouette crowd;
    float seaFull, sparksFull, crowdFull;
    Material[] pillarMats; Color pillarFull;
    HDAdditionalLightData hdMic, hdL, hdR;
    HDAdditionalLightData[] floorLights; float[] floorFull;
    public float micFull = 42000f, rimFull = 24000f; // dim-but-readable at EV 10.9 crush
    bool ready;

    float T { get { return PerfClock.T >= 0f ? PerfClock.T : Time.timeSinceLevelLoad; } }

    void Start()
    {
        var seaGO = GameObject.Find("LightSea");     if (seaGO)  sea    = seaGO.GetComponent<LightSea>();
        var fxGO  = GameObject.Find("FallingSparks");if (fxGO)   sparks = fxGO.GetComponent<FallingSparks>();
        var cwGO  = GameObject.Find("CrowdSilhouette");if (cwGO) crowd  = cwGO.GetComponent<CrowdSilhouette>();
        if (sea)    seaFull    = sea.hdr;
        if (sparks) sparksFull = sparks.hdr;
        if (crowd)  crowdFull  = crowd.phoneHdr;

        var lp = GameObject.Find("LEDPillars");
        if (lp != null)
        {
            var mrs = lp.GetComponentsInChildren<MeshRenderer>();
            pillarMats = new Material[mrs.Length];
            for (int i=0;i<mrs.Length;i++) pillarMats[i] = mrs[i].material; // instanced — play-mode safe
            if (pillarMats.Length>0) pillarFull = pillarMats[0].GetColor("_UnlitColor");
        }
        void Grab(string n, ref HDAdditionalLightData slot){ var g=GameObject.Find(n); if(g) slot=g.GetComponent<HDAdditionalLightData>(); }
        Grab("SpotMic", ref hdMic); Grab("SpotPiano", ref hdL); Grab("SpotGtr", ref hdR);
        // optional footlights root — ramps in with the key light
        var fl = GameObject.Find("FloorLights");
        if (fl != null)
        {
            floorLights = fl.GetComponentsInChildren<HDAdditionalLightData>();
            floorFull = new float[floorLights.Length];
            for (int i=0;i<floorLights.Length;i++) floorFull[i] = floorLights[i].intensity;
        }
        ready = true;
        Apply(0f); // frame 0 = pure black
    }

    void Update(){ if (ready) Apply(T); }

    static float Ramp(float t, float a, float b){ float e=Mathf.Clamp01((t-a)/Mathf.Max(0.001f,b-a)); return e*e*(3f-2f*e); }

    void Apply(float t)
    {
        float pil    = Ramp(t, 1.2f, 4.0f);
        float rim    = Ramp(t, 2.0f, 5.0f);
        float aud    = Ramp(t, 3.5f, 7.0f);
        float key    = Ramp(t, 5.0f, 8.0f);
        float spark  = Ramp(t, 6.0f, 10.0f);

        if (pillarMats != null)
            foreach (var m in pillarMats) if (m) m.SetColor("_UnlitColor", pillarFull * pil);
        if (hdL)   hdL.SetIntensity(rimFull * rim, UnityEngine.Rendering.LightUnit.Lumen);
        if (hdR)   hdR.SetIntensity(rimFull * rim, UnityEngine.Rendering.LightUnit.Lumen);
        if (hdMic) hdMic.SetIntensity(micFull * key, UnityEngine.Rendering.LightUnit.Lumen);
        if (floorLights != null)
            for (int i=0;i<floorLights.Length;i++)
                if (floorLights[i]) floorLights[i].SetIntensity(floorFull[i] * key, UnityEngine.Rendering.LightUnit.Lumen);
        if (sea)    sea.hdr       = seaFull    * aud;
        if (crowd)  crowd.phoneHdr= crowdFull  * aud;
        if (sparks) sparks.hdr    = sparksFull * spark;
    }
}
