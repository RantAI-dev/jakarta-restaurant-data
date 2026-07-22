#!/usr/bin/env python3
"""Audit tiap titik venue: reverse-geocode koordinat → pastikan BENAR-BENAR di
salah satu kota administrasi DKI Jakarta. Titik yang jatuh di Depok/Tangerang/
Tangsel(Bintaro)/Bekasi/Bogor di-REPAIR (re-geocode dari alamat) atau di-DROP.

Baca & tulis ulang platform/lib/pariwisata/seni-venues.json.
"""
import json, re, time, urllib.parse, urllib.request, sys

OUT = "platform/lib/pariwisata/seni-venues.json"
UA = {"User-Agent": "DisparSeniValidate/1.0 (disparekraf@jakarta.go.id)"}
BBOX = (-6.38, -6.05, 106.68, 106.99)  # (min_lat,max_lat,min_lon,max_lon)
NON_DKI = re.compile(r"tangerang|depok|bekasi|bogor|banten", re.I)
DKI_DIR = re.compile(r"jakarta (selatan|pusat|barat|timur|utara)", re.I)

def _req(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
        return json.load(r)

def reverse(lat, lon):
    url = "https://nominatim.openstreetmap.org/reverse?" + urllib.parse.urlencode(
        {"lat": lat, "lon": lon, "format": "json", "zoom": 12, "addressdetails": 1})
    d = _req(url); time.sleep(1.1)
    return d.get("address", {})

def geocode(q):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({
        "q": q, "format": "json", "countrycodes": "id", "limit": 1,
        "viewbox": f"{BBOX[2]},{BBOX[1]},{BBOX[3]},{BBOX[0]}", "bounded": 1})
    d = _req(url); time.sleep(1.1)
    return (float(d[0]["lat"]), float(d[0]["lon"])) if d else None

def classify(addr):
    """→ nama kota DKI (canonical) atau None kalau di luar DKI."""
    vals = " | ".join(str(v).lower() for v in addr.values())
    m = DKI_DIR.search(vals)
    if m:
        return "Jakarta " + m.group(1).title()
    if "kepulauan seribu" in vals:
        return "Kepulauan Seribu"
    if NON_DKI.search(vals):
        return None                      # jelas di luar DKI
    if re.search(r"\bjakarta\b", vals):
        return "Jakarta"                 # di DKI tapi kota tak jelas
    return None

def main():
    venues = json.load(open(OUT))
    kept, dropped, fixed = [], 0, 0
    for i, v in enumerate(venues, 1):
        if v.get("gold"):                # koordinat kurasi → biarkan
            kept.append(v); continue
        try:
            city = classify(reverse(v["lat"], v["lon"]))
        except Exception as e:
            print(f"[{i}] ! reverse {v['venue'][:30]}: {e}", file=sys.stderr); city = None
        if city:
            v["wilayah"] = city
            kept.append(v); print(f"[{i}] OK   {city:17} {v['venue'][:38]}")
            continue
        # salah tempat → coba perbaiki dari alamat
        ok = False
        if v.get("address"):
            try:
                ll = geocode(v["address"])
                if ll:
                    c2 = classify(reverse(ll[0], ll[1]))
                    if c2:
                        v["lat"], v["lon"] = round(ll[0], 6), round(ll[1], 6)
                        v["wilayah"] = c2; kept.append(v); fixed += 1; ok = True
                        print(f"[{i}] FIX  {c2:17} {v['venue'][:38]}")
            except Exception as e:
                print(f"[{i}] ! fix {v['venue'][:30]}: {e}", file=sys.stderr)
        if not ok:
            dropped += 1; print(f"[{i}] DROP  {v['venue'][:44]}")
    json.dump(sorted(kept, key=lambda o: (-o["gold"], -o["eventCount"])),
              open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"\nkept {len(kept)} | fixed {fixed} | dropped {dropped} | gold {sum(o['gold'] for o in kept)}")

if __name__ == "__main__":
    main()
