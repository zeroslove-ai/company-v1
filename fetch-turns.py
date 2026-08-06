import os, json, sys

env_path = os.path.join(os.environ.get("LOCALAPPDATA", ""), "hermes", ".env")
creds = {}
with open(env_path, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            creds[k.strip()] = v.strip()

import psycopg2
conn = psycopg2.connect(host=creds["SUPABASE_DB_HOST"], port=creds["SUPABASE_DB_PORT"],
                        dbname=creds["SUPABASE_DB_NAME"], user=creds["SUPABASE_DB_USER"],
                        password=creds["SUPABASE_DB_PASSWORD"], connect_timeout=15)
cur = conn.cursor()
GAME_ID = "11111111-1111-4111-8111-111111111111"

cur.execute("""
  SELECT expected_turn, story_text FROM game_actions
  WHERE game_id=%s AND action_kind='player_turn' AND story_text IS NOT NULL
  ORDER BY expected_turn DESC LIMIT 4
""", (GAME_ID,))
rows = cur.fetchall()
conn.close()

out = {}
for tn, story in rows:
    out[str(tn)] = story
with open(r"C:\Users\JAEWAN\projects\company-v1\turns-4.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
print(f"저장: {list(out.keys())}턴")
