using UnityEngine;

// Deterministic dance-clip cycler: alternates between two animator states ("A" / "B")
// every `period` seconds with a short crossfade. PerfClock-driven so captures are exact
// and every dancer using the same settings stays in unison.
public class DanceCycle : MonoBehaviour
{
    public float period = 32f;
    public float fade = 0.6f;
    Animator anim; int last = -1;

    float T { get { return PerfClock.T >= 0f ? PerfClock.T : Time.timeSinceLevelLoad; } }

    void Start(){ anim = GetComponent<Animator>(); }

    void Update()
    {
        if (anim == null) return;
        int idx = (int)(T / period) % 2;
        if (idx != last)
        {
            anim.CrossFadeInFixedTime(idx == 0 ? "A" : "B", fade, 0);
            last = idx;
        }
    }
}
