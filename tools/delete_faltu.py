#!/usr/bin/env python3
"""Masla-e-Karachi: faltu (unused) files/folders safai se delete karta hai.

Chalao (project root se):   python3 tools/delete_faltu.py
Sirf dekhna ho (delete nahi): python3 tools/delete_faltu.py --dry-run

Kya karta hai:
  1) Pehle check karta hai ke koi HTML / CSS / JS in paths ko use to nahi kar raha.
     Agar koi reference mila to ruk jata hai aur kuch delete nahi karta.
  2) Delete hone wali cheezon ki list aur size dikhata hai.
  3) Un sab ki backup zip banata hai: tools/faltu-backup.zip
  4) Tum 'yes' likho tabhi delete karta hai.
  5) Jo path maujood nahi hota (pehle hi delete ho chuka), usay chhor deta hai.
Windows, Mac aur Linux teeno par chalti hai. Sirf Python 3 chahiye, koi package nahi.
"""
import os
import sys
import shutil
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKUP = os.path.join(ROOT, "tools", "faltu-backup.zip")

# Jo cheezein delete honi hain (project root se relative path)
TARGETS = [
    "docs/js/pages",            # 18 purani CSS files (galat folder mein, kahin load nahi hoti)
    "docs/css/pages",           # pages.css bundle mein shamil
    "docs/css/layout",          # layout.css bundle mein shamil
    "docs/css/components",      # components.css bundle mein shamil
    "tools/css-source",         # bundle se purani copy
    "tools/css-manifest",       # sirf build_css.py ke liye
    "tools/build_css.py",       # ab chal nahi sakti
]

# In lafzon ka koi bhi live file mein hona matlab folder abhi use ho raha hai
NEEDLES = ["js/pages/", "css/pages/", "css/layout/", "css/components/"]


def abspath(rel):
    return os.path.join(ROOT, *rel.split("/"))


def size_of(path):
    if os.path.isfile(path):
        return os.path.getsize(path)
    total = 0
    for base, _, files in os.walk(path):
        for f in files:
            total += os.path.getsize(os.path.join(base, f))
    return total


def live_files():
    """docs ki woh HTML/CSS/JS/JSON files jo delete list ka hissa nahi."""
    skip = [abspath(t) + os.sep for t in TARGETS]
    out = []
    for base, _, files in os.walk(os.path.join(ROOT, "docs")):
        for f in files:
            p = os.path.join(base, f)
            if p.endswith((".html", ".css", ".js", ".json", ".webmanifest", ".xml")):
                if not any(p.startswith(s) for s in skip):
                    out.append(p)
    return out


def find_references():
    hits = []
    for p in live_files():
        try:
            text = open(p, encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        for n in NEEDLES:
            if n in text:
                hits.append((os.path.relpath(p, ROOT), n))
    return hits


def main():
    dry = "--dry-run" in sys.argv
    print("Project root:", ROOT)
    if not os.path.isdir(os.path.join(ROOT, "docs")):
        print("ERROR: 'docs' folder nahi mila. Script project root ke andar tools/ se chalao.")
        return 1

    refs = find_references()
    if refs:
        print("\nRUKO: ye files in paths ko use kar rahi hain, is liye kuch delete nahi kiya:")
        for f, n in refs:
            print("  %s  ->  %s" % (f, n))
        return 1
    print("Reference check: theek hai (koi HTML/CSS/JS in paths ko use nahi karta).")

    found = [t for t in TARGETS if os.path.exists(abspath(t))]
    missing = [t for t in TARGETS if t not in found]
    if not found:
        print("\nKuch delete karne ko nahi bacha. Sab pehle hi saaf hai.")
        return 0

    print("\nYe delete hongi:")
    total = 0
    for t in found:
        s = size_of(abspath(t))
        total += s
        kind = "FOLDER" if os.path.isdir(abspath(t)) else "FILE  "
        print("  %s %-24s %7.1f KB" % (kind, t, s / 1024.0))
    print("  Total: %.1f KB" % (total / 1024.0))
    for t in missing:
        print("  (pehle se nahi hai, chhor di) %s" % t)

    if dry:
        print("\n--dry-run: kuch delete nahi kiya.")
        return 0

    answer = input("\nBackup tools/faltu-backup.zip mein banegi. Delete karne ke liye 'yes' likho: ")
    if answer.strip().lower() != "yes":
        print("Cancel. Kuch delete nahi hua.")
        return 0

    with zipfile.ZipFile(BACKUP, "w", zipfile.ZIP_DEFLATED) as z:
        for t in found:
            p = abspath(t)
            if os.path.isfile(p):
                z.write(p, t)
            else:
                for base, _, files in os.walk(p):
                    for f in files:
                        full = os.path.join(base, f)
                        z.write(full, os.path.relpath(full, ROOT).replace(os.sep, "/"))
    print("Backup ban gayi:", os.path.relpath(BACKUP, ROOT))

    for t in found:
        p = abspath(t)
        if os.path.isdir(p):
            shutil.rmtree(p)
        else:
            os.remove(p)
        print("  delete:", t)

    print("\nHo gaya. Ab chalao:  python3 tools/find_unused.py docs")
    print("Phir site kholo:     python3 -m http.server 8000 -d docs   (DevTools > Network mein 404 nahi hona chahiye)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
