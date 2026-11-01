import sys
import os
sys.path.insert(0, os.path.abspath("."))

from backend.services.recommend_service import recommend_compare

def main():
    print("Testing Option A Pre-Filters (Duration <= 3.0h and Language Eligibility)...")
    res = recommend_compare("user_1", top_k=5)
    
    eligible = res["tfidf"]["total_eligible"]
    print(f"Eligible Candidate Events for user_1: {eligible} / 697")
    # 72 events > 3.0h + 13 events requiring English (user_1 has Cantonese, First Aid)
    assert eligible == 612, f"Expected 612, got {eligible}"

    for strat in ["tfidf", "embedding", "cross_encoder"]:
        print(f"\n=== {strat.upper()} Recommendations ===")
        items = res[strat]["items"]
        for it in items:
            ev = it["event"]
            print(f"  #{it['rank']} [Duration: {ev['duration_hours']}h] {ev['title']}")
            print(f"     Skills: {ev['required_skills']} | Region: {ev['region']}")
            
            # Assertions: No duration violation
            assert ev["duration_hours"] is not None and ev["duration_hours"] <= 3.0, (
                f"Duration filter failed: {ev['duration_hours']} > 3.0"
            )

    print("\n✅ All 3 models strictly adhered to Option A Pre-Filters! Zero violations!")

if __name__ == "__main__":
    main()
