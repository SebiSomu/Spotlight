import os
import sys

os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, ".")

print("=" * 60)
print("TEST 1: Keyword fallback DB connection + find Taylor Swift")
print("=" * 60)
try:
    from app.db import get_cursor
    with get_cursor() as cur:
        cur.execute("SELECT COUNT(*) AS n FROM events")
        print(f"Events table total rows: {cur.fetchone()['n']}")
        cur.execute("SELECT COUNT(*) AS n FROM venues")
        print(f"Venues table total rows: {cur.fetchone()['n']}")
        cur.execute("SELECT id, title, artist, venue_id FROM events WHERE artist ILIKE %s LIMIT 10", ("%taylor%swift%",))
        rows = cur.fetchall()
        print(f"\nTaylor Swift events via direct ILIKE: {len(rows)} found")
        for r in rows:
            print(f"  id={r['id']} artist={r['artist']} title={r['title']} venue_id={r['venue_id']}")
        if not rows:
            cur.execute("SELECT id, artist, title FROM events LIMIT 5")
            print("\nSample artists in DB (for debugging):")
            for r in cur.fetchall():
                print(f"  id={r['id']} artist={r['artist']} title={r['title']}")
except Exception as e:
    print(f"DB ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)
print("TEST 2: Retriever keyword fallback (no pgvector needed)")
print("=" * 60)
try:
    from app.retriever import retriever
    docs = retriever._keyword_fallback("Taylor Swift", 5)
    print(f"Keyword fallback returned {len(docs)} docs")
    for i, d in enumerate(docs[:3]):
        print(f"  [Doc {i}] {d['source_id']}")
        print(f"    Text preview: {str(d['text'])[:250]}")
except Exception as e:
    print(f"RETRIEVER ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)
print("TEST 3: Full chat with 'Tell me about Taylor Swift concerts'")
print("=" * 60)
try:
    from app.chat import process_chat_request
    result = process_chat_request("Tell me about Taylor Swift concerts")
    print(f"Reply length = {len(result['reply'])}")
    print(f"Sources = {result['sources']}")
    print()
    print("--- Reply (showing all) ---")
    print(result["reply"])
except Exception as e:
    print(f"CHAT PIPELINE ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)
print("TEST 4: Test Groq API KEY against actual Groq REST /models endpoint")
print("=" * 60)
try:
    import os
    import urllib.request
    import json
    key = os.getenv("GROQ_API_KEY", "").strip()
    if not key:
        print("No GROQ_API_KEY found in env")
    else:
        print(f"Using GROQ_API_KEY length={len(key)} ...")
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {key}"}
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                model_ids = [m["id"] for m in data.get("data", [])]
                print(f"Groq returns {len(model_ids)} available models:")
                for m in model_ids:
                    print(f"  - {m}")
                if model_ids:
                    print(f"\nChoosing first valid available: {model_ids[0]}")
        except urllib.error.HTTPError as he:
            print(f"Groq /models HTTP ERROR {he.code}: {he.read().decode()[:600]}")
except Exception as e:
    print(f"GROQ TEST ERR: {type(e).__name__}: {e}")

print("\nDONE")
