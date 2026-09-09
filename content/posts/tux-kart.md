---
title: Tux Kart
description: Medium reversing challenge peeling a .NET dropper to reach a rebuilt SuperTuxKart binary, then recovering an HMAC-SHA256 + XOR-encoded flag fully offline from static .rdata constants.
image: /static/netanix.png
event: NxCTF
tags:
  - writeup
  - reversing
difficulty: medium
date: 2026-09-06
---

|                |                                                                    |
| -------------- | ------------------------------------------------------------------ |
| **Challenge**  | tux-kart                                                            |
| **Category**   | Reverse Engineering / .NET Dropper                                 |
| **Difficulty** | Medium                                                              |
| **Flag**       | `Neta{[REDACTED]}`                                                  |

---

## TL;DR (Summary)

`files.zip` ships a 150 MB "game" — actually a .NET dropper that unpacks a trimmed
SuperTuxKart 1.5 build (`LapLock`). The rebuilt `LapLock.exe` hides the flag in its
race-finish handler: complete 6 laps and it prints `HMAC-SHA256(key, "z7q")` XORed
against a 45-byte table. Both operands are static constants in `.rdata`, so the flag
falls out offline — no need to run the game (Windows-only) or actually race.

---

## 1. Peel the dropper

`tuxcart.exe` is a PE32+ .NET assembly whose `Launcher.Main` does
`GetManifestResourceStream("payload")` → `ZipFile.ExtractToDirectory` under
`%LocalAppData%` → `Process.Start(@"LapLock\LapLock.exe")`. The resource blob is a
plain ZIP at file offset **956** (the .NET metadata is appended *after* it), so it can
be carved and unzipped directly:

```bash
unzip -p original/files.zip tuxcart.exe > work/tuxcart.exe
tail -c +957 work/tuxcart.exe > work/embedded.zip     # 2274 entries
unzip -q work/embedded.zip -d work/extracted          # -> work/extracted/LapLock/
```

The tree is stock SuperTuxKart 1.5 stripped to one track (`zengarden`) and one kart
(`sara_the_racer`). Only `LapLock.exe` and `data/supertuxkart.git` carry 2026
timestamps — the exe is the rebuilt one.

## 2. Find the custom code

The only non-stock UTF-16 string in the binary is
`Out of time. You needed 6 laps. The vault stays shut.` @ `0x140870FC0`. Its single
xref lands in `fcn.1402b2db0`, the race-finish handler:

- `cmp esi, 6` / `jl` → failure string (lap counter must be ≥ 6)
- success branch → `sub_1402b1e50(out, 0x140870C40, 0x20, 0x140870F90, 3)`

`sub_1402b1e50` is textbook HMAC: `0x36`/`0x5C` ipad/opad blocks at
`0x140871070`/`0x140871080`, and `sub_1402b1bd0` is SHA-256 (standard
`6a09e667…` IV). So it is `HMAC-SHA256(key = 32 bytes @0x140870C40, msg = "z7q")`.

A `std::string(45, '-')` is then filled byte-by-byte with inlined `xor al, imm8`:
`flag[i] = digest[i] ^ K1[i]` for `i` in 0..31 and `flag[32+j] = digest[j] ^ K2[j]`
for `j` in 0..12. Note the digest index **restarts at 0** for the tail. The same
`K1||K2` bytes also sit contiguously at `0x140870C80`.

## 3. Reproduce it offline

```python
#!/usr/bin/env python3
"""tux-kart — recover the flag statically from LapLock.exe."""
import hashlib, hmac, os

EXE = os.path.join(os.path.dirname(__file__), "..", "work",
                   "extracted", "LapLock", "LapLock.exe")

# .rdata: vaddr 0x140840000 -> file offset 0x83e600
def va2off(va):
    return va - 0x140840000 + 0x83E600

data = open(EXE, "rb").read()
key = data[va2off(0x140870C40):va2off(0x140870C40) + 32]
msg = data[va2off(0x140870F90):va2off(0x140870F90) + 3]   # b"z7q"
tbl = data[va2off(0x140870C80):va2off(0x140870C80) + 45]  # K1 (32) || K2 (13)

buf = hmac.new(key, msg, hashlib.sha256).digest()
flag = bytes(buf[i] ^ tbl[i] for i in range(32)) \
     + bytes(buf[j] ^ tbl[32 + j] for j in range(13))
print(flag.decode())
assert flag.startswith(b"Neta{") and flag.endswith(b"}")
```

```
$ python3 scripts/solve.py
Neta{[REDACTED]}
```

---

## Flag

```
Neta{[REDACTED]}
```

---

## Notes

- Solved **fully statically** — the sample is a Windows PE and was never executed
  (host is Apple Silicon macOS; all triage ran in an amd64 container).
- Constants for cross-checking:
  - `LapLock.exe` sha256 `6db91d786231df471f40d96da5654bc1baf4039d29f154181bc83933194ec305`
  - key `a73c5f9218e4d16b472e9a035cf8b471832dc64a917f50e2b3681cd946ab257e`
  - table `aafc5d31ac0e688fee63f5c4b652e63045a20ceff4bcb9803e5c9bbc4939ccaa81a81b60ee502ecdb225b985b3`
- Tools: `unzip`, `radare2` / `rabin2`, `strings`, Python 3 `hmac`/`hashlib`.

---

## Key Takeaways

1. **Droppers don't need to run** — a .NET launcher's embedded resource ZIP can be carved straight out of the file by locating the local-file-header offset; no need to execute the dropper or the (Windows-only) payload.
2. **Look for the one non-stock string** — in a huge stock codebase (SuperTuxKart), the fastest way to the custom logic is diffing which strings/files don't belong, then following the single xref back to the challenge-specific function.
3. **Recognize HMAC/SHA-256 by shape** — `0x36`/`0x5C` ipad/opad blocks plus the standard `6a09e667…` IV are enough to identify the primitive without a signature database.
4. **Static constants + a known algorithm = offline solve** — once the key, message, and XOR table are all fixed values in `.rdata`, the flag is a pure function of the binary; there's no need to interact with the running challenge at all.
