"""Re-point the Unity MCP server from 'My project' (URP) to 'SparkleHDRP' (HDRP).
Run this with Claude Code CLOSED (avoids a config write-race), then reopen Claude Code.
  py design/idola/scripts/sparkle_hdrp_repoint.py            # switch to SparkleHDRP
  py design/idola/scripts/sparkle_hdrp_repoint.py --back     # switch back to 'My project'
"""
import json, os, sys, shutil, time

CFG = os.path.expanduser("~/.claude.json")
MYPROJ = r"G:\Unity\Projects\My project"
HDRP   = r"G:\Unity\Projects\SparkleHDRP"

target = MYPROJ if "--back" in sys.argv else HDRP

with open(CFG, encoding="utf-8") as f:
    d = json.load(f)

srv = d.get("mcpServers", {}).get("unity")
if not srv:
    print("ERROR: no 'unity' MCP server found in ~/.claude.json"); sys.exit(1)

args = srv.get("args", [])
if "--project-path" in args:
    i = args.index("--project-path")
    old = args[i + 1]
    args[i + 1] = target
else:
    old = "(none)"
    srv["args"] = ["--mcp", "--project-path", target]

bak = CFG + ".sparkle-bak-" + str(int(time.time()))
shutil.copy2(CFG, bak)
with open(CFG, "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"unity MCP project-path: {old}  ->  {target}")
print(f"backup written: {bak}")
print("Now: reopen Claude Code, then in the SparkleHDRP Editor approve")
print("  Edit > Project Settings > AI > Unity MCP > Pending Connections.")
