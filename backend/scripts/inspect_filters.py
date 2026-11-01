import sqlite3
import json

def main():
    conn = sqlite3.connect("backend/volunteer.db")
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM events")
    total_events = cursor.fetchone()[0]
    print(f"Total Events in Database: {total_events}\n")

    # 1. duration_hours analysis
    cursor.execute("SELECT duration_hours, COUNT(*) FROM events GROUP BY duration_hours ORDER BY duration_hours")
    durations = cursor.fetchall()
    print("=== 1. Duration (Hours) Distribution ===")
    null_dur = 0
    for d, cnt in durations:
        if d is None:
            null_dur = cnt
        else:
            print(f"  {d:>4.1f} hours : {cnt:>3} events ({cnt/total_events*100:>5.1f}%)")
    if null_dur:
        print(f"  Unspecified: {null_dur:>3} events ({null_dur/total_events*100:>5.1f}%)")

    # 2. Region analysis
    cursor.execute("SELECT region, COUNT(*) FROM events GROUP BY region ORDER BY COUNT(*) DESC")
    regions = cursor.fetchall()
    print("\n=== 2. Region Distribution ===")
    for r, cnt in regions:
        reg_name = r if r else "Unspecified"
        print(f"  {reg_name:<20}: {cnt:>3} events ({cnt/total_events*100:>5.1f}%)")

    # 3. Required skills / languages
    cursor.execute("SELECT required_skills FROM events")
    skills_counts = {}
    no_skills_req = 0
    for (s_json,) in cursor.fetchall():
        try:
            s_list = json.loads(s_json or "[]")
            if not s_list:
                no_skills_req += 1
            for s in s_list:
                skills_counts[s] = skills_counts.get(s, 0) + 1
        except:
            no_skills_req += 1
    print("\n=== 3. Required Skills Distribution ===")
    print(f"  No specific skill required: {no_skills_req} events ({no_skills_req/total_events*100:.1f}%)")
    for s, cnt in sorted(skills_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {s:<25}: {cnt:>3} events ({cnt/total_events*100:>5.1f}%)")

    # 4. Issue areas / Causes distribution
    cursor.execute("SELECT issue_areas FROM events")
    causes_counts = {}
    for (c_json,) in cursor.fetchall():
        try:
            c_list = json.loads(c_json or "[]")
            for c in c_list:
                causes_counts[c] = causes_counts.get(c, 0) + 1
        except:
            pass
    print("\n=== 4. Issue Areas / Causes Distribution ===")
    for c, cnt in sorted(causes_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {c:<30}: {cnt:>3} events ({cnt/total_events*100:>5.1f}%)")

    # 5. User test profiles preferences
    cursor.execute("SELECT id, name, preferred_regions, max_duration_hours, skills, preferred_causes FROM users LIMIT 10")
    print("\n=== 5. Sample Cold-Start Test Users Profiles ===")
    for uid, name, r_json, max_d, s_json, c_json in cursor.fetchall():
        print(f"  {uid:<8} | MaxDur: {max_d or 'N/A':<4} | Regions: {r_json:<30} | Skills: {s_json:<25} | Causes: {c_json}")

    conn.close()

if __name__ == "__main__":
    main()

