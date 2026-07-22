import json, re, time, urllib.parse, urllib.request, os
CACHE="scripts/geocode_cache.json"
UA="DisparHalalGeocode/1.0 (kleopasevan@gmail.com)"
cache=json.load(open(CACHE)) if os.path.exists(CACHE) else {}
def clean(s): return re.sub(r"\s+"," ",str(s).replace("\n",", ")).strip(" ,")
def nomi(q):
    url="https://nominatim.openstreetmap.org/search?"+urllib.parse.urlencode({"q":q,"format":"json","limit":1})
    req=urllib.request.Request(url,headers={"User-Agent":UA})
    with urllib.request.urlopen(req,timeout=25) as r: d=json.load(r)
    time.sleep(1.1); return d
cats=json.load(open("data/halal-crawl.json"))
filled=0; tried=0
for c in cats:
    for e in c["results"]:
        if e.get("review_status")=="rejected": continue
        if e.get("lat","").strip(): continue
        al=clean(e.get("alamat","")) or clean(e.get("nama",""))
        if not al: continue
        q=al if re.search(r"jakarta",al,re.I) else al+", Jakarta, Indonesia"
        key=("HALAL::"+q).upper()
        if key in cache:
            hit=cache[key]
        else:
            tried+=1
            try: data=nomi(q)
            except Exception as ex: data=[]
            hit={"lat":data[0]["lat"],"lon":data[0]["lon"]} if data else {"lat":"","lon":""}
            cache[key]=hit; json.dump(cache,open(CACHE,"w"),ensure_ascii=False)
        if hit["lat"]:
            e["lat"]=hit["lat"]; e["lon"]=hit["lon"]; e["geo_source"]="OpenStreetMap/Nominatim"; filled+=1
json.dump(cats,open("data/halal-crawl.json","w"),ensure_ascii=False)
print(f"tried {tried} geocode queries, filled {filled} coords")
for c in cats:
    rs=[e for e in c["results"] if e.get("review_status")!="rejected"]
    print(f"  {c['key']:22} coord:{sum(1 for e in rs if e.get('lat','').strip())}/{len(rs)}")
