#!/usr/bin/env python3
"""Build a geocoded venue datamart for the seni-pertunjukan indicator map.

Input : JSON array of `data-seni-pertunjukan-dan-visual` records on stdin
        (each: nama_event, nama_venue, lokasi_venue, periode_data).
Output: platform/lib/pariwisata/seni-venues.json  (one entry per unique venue)
Reuses : scripts/geocode_cache.json (Photon results), Photon POI search for misses.

GOLD venues = tempat yang menghadirkan artis Top-10 Global Chart terverifikasi
(GBK, JIS — Ed Sheeran / Bruno Mars / Justin Bieber). Ditandai emas di peta.
"""
import json, math, os, re, sys, time, urllib.parse, urllib.request

CACHE = "scripts/geocode_cache.json"
OUT = "platform/lib/pariwisata/seni-venues.json"
JKT = (-6.2088, 106.8456)
# Bounding box DKI Jakarta daratan (buang Tangerang/Bekasi/Bogor/Depok).
# (min_lat, max_lat, min_lon, max_lon)
BBOX = (-6.38, -6.05, 106.68, 106.99)

def in_jakarta(lat, lon):
    return BBOX[0] <= lat <= BBOX[1] and BBOX[2] <= lon <= BBOX[3]

# --- verified Top-10 appearances (selaras lib/pariwisata/jakarta-appearances.ts) ---
GOLD_VENUES = {
    "JAKARTA INTERNATIONAL STADIUM": {
        "name": "Jakarta International Stadium (JIS)",
        "coord": (-6.1210, 106.8430),
        "artists": ["Ed Sheeran (2024)", "Bruno Mars (2024)"],
    },
    "GELORA BUNG KARNO": {
        "name": "Gelora Bung Karno (GBK)",
        "coord": (-6.2185, 106.8021),
        "artists": ["Ed Sheeran (2019)", "Bruno Mars (2014)", "Justin Bieber (2013, 2022)"],
    },
}

def clean(loc):
    s = str(loc or "").replace("\n", ", ").replace("\r", " ")
    return re.sub(r"\s+", " ", s).strip(" ,")

def haversine(a, b):
    R = 6371
    dlat = math.radians(b[0]-a[0]); dlon = math.radians(b[1]-a[1])
    x = (math.sin(dlat/2)**2 + math.cos(math.radians(a[0]))*math.cos(math.radians(b[0]))
         * math.sin(dlon/2)**2)
    return 2*R*math.asin(math.sqrt(x))

UA = {"User-Agent": "DisparSeniGeocode/2.0 (disparekraf@jakarta.go.id)"}

def nominatim(q):
    """Geocode alamat, HASIL DIBATASI ke kotak Jakarta (bounded=1)."""
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({
        "q": q, "format": "json", "countrycodes": "id", "limit": 1,
        "viewbox": f"{BBOX[2]},{BBOX[1]},{BBOX[3]},{BBOX[0]}", "bounded": 1,
    })
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.load(r)
    time.sleep(1.1)  # kebijakan Nominatim ~1 req/detik
    if data:
        return (float(data[0]["lat"]), float(data[0]["lon"]))
    return None

def photon(q):
    url = "https://photon.komoot.io/api/?" + urllib.parse.urlencode({
        "q": q, "limit": 5, "lat": JKT[0], "lon": JKT[1],
        "bbox": f"{BBOX[2]},{BBOX[0]},{BBOX[3]},{BBOX[1]}",
    })
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.load(r)
    time.sleep(0.6)
    return data.get("features", [])

def geocode(query):
    """Alamat → koordinat DALAM Jakarta. Di luar kotak Jakarta = ditolak."""
    q = clean(query)
    if not q:
        return None
    # 1) Nominatim (alamat, bounded ke Jakarta)
    try:
        ll = nominatim(q)
        if ll and in_jakarta(*ll):
            return ll
    except Exception as e:
        print(f"  ! nominatim {q[:36]}: {e}", file=sys.stderr)
    # 2) Photon (bbox Jakarta) — validasi ketat
    try:
        for f in photon(q):
            g = f["geometry"]["coordinates"]  # [lon, lat]
            ll = (g[1], g[0])
            if f["properties"].get("countrycode") == "ID" and in_jakarta(*ll):
                return ll
    except Exception as e:
        print(f"  ! photon {q[:36]}: {e}", file=sys.stderr)
    return None

def wilayah_from(addr):
    a = (addr or "").upper()
    if "SERIBU" in a: return "Kepulauan Seribu"
    for pat, name in [
        (r"JAKARTA SELATAN|SOUTH JAKARTA|JKT SELATAN", "Jakarta Selatan"),
        (r"JAKARTA PUSAT|CENTRAL JAKARTA|JKT PUSAT", "Jakarta Pusat"),
        (r"JAKARTA BARAT|WEST JAKARTA|JKT BARAT", "Jakarta Barat"),
        (r"JAKARTA TIMUR|EAST JAKARTA|JKT TIMUR", "Jakarta Timur"),
        (r"JAKARTA UTARA|NORTH JAKARTA|JKT UTARA", "Jakarta Utara"),
    ]:
        if re.search(pat, a): return name
    if re.search(r"CIBUBUR|CILANGKAP|PONDOK GEDE", a): return "Jakarta Timur"
    m = re.search(r"(?:^|[^0-9])(1[0-4][0-9]{3})(?:[^0-9]|$)", a)
    if m:
        return {"10": "Jakarta Pusat", "11": "Jakarta Barat", "12": "Jakarta Selatan",
                "13": "Jakarta Timur", "14": "Jakarta Utara"}[m.group(1)[:2]]
    return "Jakarta (tidak terinci)"

def gold_match(venue):
    v = venue.upper()
    # HANYA venue Top-10 terverifikasi: JIS & Gelora Bung Karno (bukan "Beach City
    # International Stadium" / "Stadion Madya" yang menghadirkan act non-Top-10).
    if "JAKARTA INTERNATIONAL STADIUM" in v:
        return GOLD_VENUES["JAKARTA INTERNATIONAL STADIUM"]
    if "GELORA BUNG KARNO" in v or "STADION UTAMA GELORA" in v or "BUNG KARNO" in v:
        return GOLD_VENUES["GELORA BUNG KARNO"]
    return None

def main():
    rows = json.load(sys.stdin)
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

    # group by venue
    venues = {}
    for r in rows:
        v = clean(r.get("nama_venue"))
        if not v: continue
        e = venues.setdefault(v, {"address": "", "events": []})
        addr = clean(r.get("lokasi_venue"))
        if addr and len(addr) > len(e["address"]): e["address"] = addr
        ev = clean(r.get("nama_event"))
        if ev: e["events"].append({"nama_event": ev, "periode": clean(r.get("periode_data"))})

    out, geocoded, from_cache, missed = [], 0, 0, 0
    for i, (venue, info) in enumerate(sorted(venues.items()), 1):
        key = venue.upper()
        latlon = None
        cached = cache.get(key)
        # Reuse HANYA hasil metode baru (bounded) yang benar-benar di Jakarta.
        if (cached and cached.get("match") == "seni-bounded" and cached.get("lat")
                and in_jakarta(float(cached["lat"]), float(cached["lon"]))):
            latlon = (float(cached["lat"]), float(cached["lon"])); from_cache += 1
        elif cached and cached.get("match") == "seni-miss":
            latlon = None; missed += 1  # sudah gagal dgn metode baru → skip
        else:
            # Alamat lengkap dulu (presisi), lalu nama venue — semua dibatasi Jakarta.
            latlon = geocode(info["address"]) or geocode(venue + ", Jakarta")
            if latlon:
                cache[key] = {"alamat": info["address"], "lat": str(latlon[0]),
                              "lon": str(latlon[1]), "match": "seni-bounded",
                              "query": f"seni:{venue[:40]}"}
                geocoded += 1
            else:
                cache[key] = {"alamat": info["address"], "lat": "", "lon": "",
                              "match": "seni-miss", "query": f"seni:{venue[:40]}"}
                missed += 1
        gold = gold_match(venue)
        if latlon is None and gold:  # gold venue selalu tampil (pakai koordinat kurasi)
            latlon = gold["coord"]
        if latlon is None:
            print(f"[{i}/{len(venues)}] MISS {venue[:48]}"); continue
        out.append({
            "venue": venue,
            "address": info["address"],
            "wilayah": wilayah_from(info["address"]),
            "lat": round(latlon[0], 6), "lon": round(latlon[1], 6),
            "eventCount": len(info["events"]),
            "events": info["events"][:40],
            "gold": bool(gold),
            "artists": gold["artists"] if gold else [],
        })

    # --- Kanonikalisasi venue GOLD: gabung varian nama (mis. dua ejaan JIS) jadi
    # satu titik per venue terverifikasi, pakai koordinat kurasi + gabungan event.
    gold_canon, final = {}, []
    for o in out:
        g = gold_match(o["venue"])
        if not g:
            final.append(o); continue
        name = g["name"]
        if name not in gold_canon:
            gold_canon[name] = {
                "venue": name, "address": o["address"], "wilayah": wilayah_from(o["address"]),
                "lat": g["coord"][0], "lon": g["coord"][1],
                "eventCount": 0, "events": [], "gold": True, "artists": g["artists"],
            }
            final.append(gold_canon[name])
        gold_canon[name]["events"] += o["events"]
        gold_canon[name]["eventCount"] += o["eventCount"]
    # GBK sintetis bila tak ada varian GBK di dataset
    gbk = GOLD_VENUES["GELORA BUNG KARNO"]
    if gbk["name"] not in gold_canon:
        final.append({
            "venue": gbk["name"], "address": "Jl. Pintu Satu Senayan, Jakarta Pusat",
            "wilayah": "Jakarta Pusat", "lat": gbk["coord"][0], "lon": gbk["coord"][1],
            "eventCount": 0, "events": [], "gold": True, "artists": gbk["artists"],
        })
    for o in final:
        o["events"] = o["events"][:40]
    out = final

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(sorted(out, key=lambda o: (-o["gold"], -o["eventCount"])),
              open(OUT, "w"), ensure_ascii=False, indent=1)
    json.dump(cache, open(CACHE, "w"), ensure_ascii=False, indent=0)
    print(f"\nvenues: {len(venues)} | placed: {len(out)} "
          f"(cache {from_cache}, photon {geocoded}, miss {missed}) | gold: "
          f"{sum(o['gold'] for o in out)}")

if __name__ == "__main__":
    main()
