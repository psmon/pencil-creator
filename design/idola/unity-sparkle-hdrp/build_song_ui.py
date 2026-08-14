"""Mux a rendered frame sequence + audio into an mp4 with a bottom-right music-player UI
(title / artist / track x-of-2 / progress bar / total time), Metro-typographic style.
Run with cwd = this script's dir so fontfile relative paths avoid the Windows drive colon.

usage: build_song_ui.py <frames_dir> <audio> <title> <artist> <track> <out.mp4>
"""
import subprocess, sys, os

frames_dir, audio, title, artist, track, out = sys.argv[1:7]
HERE = os.path.dirname(os.path.abspath(__file__))

dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
      "-of","default=noprint_wrappers=1:nokey=1", audio], capture_output=True, text=True).stdout.strip())

W,H = 1920,1080
mx = 70
bw = W - 2*mx
bary = H - 74
FB = "fonts/malgunbd.ttf"
FR = "fonts/malgun.ttf"

def esc(t):
    return t.replace("\\","\\\\").replace(":","\\:").replace("%","\\%").replace("'","\u2019")

mmss = f"{int(dur//60)}\\:{int(dur%60):02d}"  # colon escaped for drawtext

parts = [
    f"drawbox=x={mx}:y={bary}:w={bw}:h=3:color=white@0.20:t=fill",
    f"drawbox=x={mx}:y={bary}:w='{bw}*min(t/{dur:.3f}\\,1)':h=3:color=white@0.92:t=fill",
    f"drawbox=x='{mx}+{bw}*min(t/{dur:.3f}\\,1)-3':y={bary}-3:w=7:h=9:color=white@0.92:t=fill",
    f"drawtext=fontfile={FB}:text='{esc(title)}':fontcolor=white@0.96:fontsize=46:x=w-tw-{mx}:y={bary}-118:shadowcolor=black@0.55:shadowx=0:shadowy=2",
    f"drawtext=fontfile={FR}:text='{esc(artist)}':fontcolor=white@0.60:fontsize=27:x=w-tw-{mx}:y={bary}-62:shadowcolor=black@0.55:shadowx=0:shadowy=1",
    f"drawtext=fontfile={FR}:text='{esc(track)}':fontcolor=white@0.45:fontsize=22:x=w-tw-{mx}:y={bary}-156",
    f"drawtext=fontfile={FR}:text='{mmss}':fontcolor=white@0.5:fontsize=20:x=w-tw-{mx}:y={bary}+12",
]
vf = ",".join(parts)

cmd = ["ffmpeg","-y","-framerate","24","-i", os.path.join(frames_dir,"frame_%05d.jpg"),
       "-i", audio, "-vf", vf, "-map","0:v:0","-map","1:a:0",
       "-c:v","libx264","-preset","medium","-crf","20","-pix_fmt","yuv420p",
       "-c:a","aac","-b:a","192k","-shortest","-movflags","+faststart", out]
r = subprocess.run(cmd, cwd=HERE, capture_output=True, text=True, encoding="utf-8", errors="replace")
if r.returncode != 0:
    sys.stderr.write(r.stderr[-2500:]); sys.exit(1)
print("OK", out, f"dur={dur:.1f}s")
