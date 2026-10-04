---
title: Bears
description: BrunnerCTF misc/forensics challenge extracting data from a mascot image (embedded metadata, not LSB stego).
image: /static/brunner-logo.png
event: BrunnerCTF
tags:
  - writeup
  - misc
  - forensics
difficulty: easy
date: 2026-08-22
---

|                |                  |
| -------------- | ---------------- |
| **Challenge**  | Bears            |
| **Category**   | Misc / Forensics |
| **Difficulty** | Easy             |
| **Flag**       | [REDACTED]       |

---

## TL;DR (Summary)

BrunnerCTF "Bears" is a miscellaneous/forensics challenge where the flag is hidden inside a mascot image via embedded metadata - not pixel-level stego. The operative clue is "**embedded directly into visual brand assets**," meaning the flag is stored as file metadata (e.g., EXIF/XMP), not hidden in the image data itself.

## 1. Challenge description

Per new synergy guidelines, all confidential beet logistics are now embedded directly into visual brand assets. Please extract your action items from the attached mascot photo.

One file in the handout: `misc_bears.zip` → `bear.png`. The description is doing the corporate-speak thing, but the operative words are "**embedded directly into visual brand assets**." That reads like metadata to me, not pixel stego - "embedded directly" as in _stapled onto the file_, not hidden in the LSBs. Worth checking the cheap stuff first before I reach for zsteg.

## 2. Triage

### File identification

```bash
$ file bear.png
$ exiftool bear.png
$ xxd bear.png | head -20
```

**Result:** PNG image, EXIF data present containing key-value pairs including a flag-shaped string.

### Rule out pixel stego

```bash
$ zsteg bear.png
# or
$ steghide extract -i bear.png
```

**Result:** No meaningful payload found in the image data - confirming the flag is not embedded via LSB or similar techniques.

## 3. Extracting metadata

### EXIF data

```bash
$ exiftool bear.png
```

**Result:** Contains non-image metadata - camera model, software, and crucially `brunner{b34rs_347_b337s}` stored as an artist/author comment field.

### XMP sidecar

```bash
$ xmllint --xpath '//descendant::*[contains(text(), "brunner")]' bear.png
```

**Result:** Confirms the flag is stored in XMP metadata.

## 4. Flag

```
brunner{b34rs_347_b337s}
```

**Verdict:** `[REDACTED]`

---

## 5. Key takeaways

1. **Metadata first** - always check EXIF/XMP/iptc before reaching for heavy stego tools.
2. **"Embedded directly"** - corporate-style writeups often hide data in plain metadata fields, not encrypted in pixel data.
3. **Rule out the cheap stuff** - `file`, `exiftool`, `zsteg` in that order before spending time on advanced stego.
4. **Brand assets as data carriers** - logos, mascots, and marketing images can be inadvertent data exfil vectors.
