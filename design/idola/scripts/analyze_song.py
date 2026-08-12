"""Song structure analyzer for group choreography (soundfile + numpy).
Outputs BPM, beat grid, per-second energy, and coarse sections (low/mid/high)
plus climax windows -> used to time unison vs. spotlight-rotation choreography.
Usage: py analyze_song.py "<path>"  [> out.json]
"""
import sys, json
import numpy as np
import soundfile as sf

def main(path):
    y, sr = sf.read(path, dtype="float32")
    if y.ndim > 1:
        y = y.mean(axis=1)
    dur = len(y) / sr

    hop = 512
    n = (len(y) - 1) // hop
    # RMS energy envelope
    env = np.sqrt(np.array([np.mean(y[i*hop:(i+1)*hop]**2) for i in range(n)]))
    fps = sr / hop

    # onset envelope (positive energy flux)
    onset = np.diff(env, prepend=env[0])
    onset[onset < 0] = 0.0

    # tempo via autocorrelation of onset (60..160 BPM)
    def lag_for(b): return int(round(fps * 60.0 / b))
    bpms = np.arange(60.0, 160.01, 0.2)
    scores = np.zeros(len(bpms))
    for k, b in enumerate(bpms):
        L = lag_for(b)
        if 1 <= L < len(onset):
            scores[k] = float(np.sum(onset[L:] * onset[:-L]))
    bpm = float(bpms[int(np.argmax(scores))])
    L = lag_for(bpm)
    beat_period = 60.0 / bpm

    # beat phase
    offs = np.array([float(np.sum(onset[o::L])) for o in range(L)])
    beat0 = int(np.argmax(offs)) / fps
    beats = np.arange(beat0, dur, beat_period)

    # per-second normalized energy
    persec = int(round(fps))
    prof = np.array([env[i:i+persec].mean() for i in range(0, len(env), persec)])
    prof = prof / (prof.max() or 1.0)
    # smooth
    ker = np.ones(5) / 5.0
    sm = np.convolve(prof, ker, mode="same")

    # section labels per second: low<0.45, mid<0.72, else high
    def lvl(v): return "low" if v < 0.45 else ("mid" if v < 0.72 else "high")
    labels = [lvl(v) for v in sm]
    # merge into sections with min length 4s
    sections = []
    s = 0
    for i in range(1, len(labels) + 1):
        if i == len(labels) or labels[i] != labels[s]:
            sections.append({"start": s, "end": i, "level": labels[s]})
            s = i
    # merge short (<4s) sections into neighbor
    merged = []
    for sec in sections:
        if merged and (sec["end"] - sec["start"] < 4):
            merged[-1]["end"] = sec["end"]
        else:
            merged.append(dict(sec))

    # climax windows = contiguous high sections (candidate spotlight zones)
    climaxes = [{"start": s["start"], "end": s["end"]} for s in merged if s["level"] == "high"]

    out = {
        "path": path, "duration": round(dur, 2), "sr": sr,
        "bpm": round(bpm, 1), "beat0": round(beat0, 3), "beat_period": round(beat_period, 4),
        "beats_count": int(len(beats)),
        "beats": [round(float(b), 3) for b in beats[::1]],
        "energy_per_sec": [round(float(v), 3) for v in sm],
        "sections": merged,
        "climaxes": climaxes,
    }
    return out

if __name__ == "__main__":
    print(json.dumps(main(sys.argv[1])))
