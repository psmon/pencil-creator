// Shared performance clock. When T >= 0, all directors follow it (deterministic capture);
// otherwise they use the AudioSource time (normal Play).
public static class PerfClock
{
    public static float T = -1f;
}
