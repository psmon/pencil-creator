"""Pure-stdlib beat/tempo analysis for BEAT_Mastered_run.wav.
No numpy/librosa. Outputs BPM, duration, beat phase, and a coarse energy profile
(for section structure -> spotlight timing). Prints JSON."""
import wave, array, json, math, sys

WAV = r"C:\code\psmon\pencil-creator\music\BEAT_Mastered_run.wav"

def read_mono(path):
    w = wave.open(path, 'rb')
    sr = w.getframerate(); n = w.getnframes(); ch = w.getnchannels(); sw = w.getsampwidth()
    raw = w.readframes(n); w.close()
    if sw == 2:
        a = array.array('h'); a.frombytes(raw)
    elif sw == 4:
        a = array.array('i'); a.frombytes(raw)
    elif sw == 1:
        a = array.array('b'); a.frombytes(raw)
    else:
        raise SystemExit("unsupported sampwidth %d" % sw)
    # downmix to mono
    if ch > 1:
        mono = array.array('f', [0.0]) * (len(a)//ch)
        for i in range(len(mono)):
            s = 0
            base = i*ch
            for c in range(ch): s += a[base+c]
            mono[i] = s/ch
    else:
        mono = array.array('f', (float(x) for x in a))
    return mono, sr

def analyze():
    mono, sr = read_mono(WAV)
    dur = len(mono)/sr
    hop = 512
    # short-time energy envelope
    env = []
    for i in range(0, len(mono)-hop, hop):
        s = 0.0
        for j in range(i, i+hop, 4):   # subsample for speed
            v = mono[j]; s += v*v
        env.append(math.sqrt(s))
    # onset envelope (positive energy flux)
    onset = [0.0]*len(env)
    for i in range(1, len(env)):
        d = env[i]-env[i-1]
        onset[i] = d if d > 0 else 0.0
    fps_env = sr/hop   # envelope frames per second
    # autocorrelation over BPM 60..160
    def lag_for_bpm(b): return int(round(fps_env*60.0/b))
    best_bpm, best_score = 0, -1
    for bpm10 in range(600, 1601, 2):   # 60.0 .. 160.0 step 0.2
        bpm = bpm10/10.0
        lag = lag_for_bpm(bpm)
        if lag < 1 or lag >= len(onset): continue
        s = 0.0
        for i in range(lag, len(onset)):
            s += onset[i]*onset[i-lag]
        # normalize slightly toward mid tempo
        if s > best_score: best_score, best_bpm = s, bpm
    # beat phase: find offset (0..lag) maximizing comb of onset at best_bpm
    lag = lag_for_bpm(best_bpm)
    best_off, best_c = 0, -1
    for off in range(lag):
        c = 0.0; i = off
        while i < len(onset):
            c += onset[i]; i += lag
        if c > best_c: best_c, best_off = c, off
    beat0 = best_off/fps_env
    beat_period = 60.0/best_bpm
    # coarse energy profile per 1s (normalized) for section detection
    per_sec = int(round(fps_env))
    prof = []
    for i in range(0, len(env), per_sec):
        chunk = env[i:i+per_sec]
        prof.append(sum(chunk)/max(1,len(chunk)))
    mx = max(prof) or 1.0
    prof = [round(p/mx, 3) for p in prof]
    return {
        "duration": round(dur, 2), "sr": sr, "bpm": round(best_bpm, 1),
        "beat0": round(beat0, 3), "beat_period": round(beat_period, 3),
        "energy_per_sec": prof,
    }

print(json.dumps(analyze()))
