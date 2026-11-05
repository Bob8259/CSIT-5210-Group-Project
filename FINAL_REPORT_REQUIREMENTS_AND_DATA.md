# CSIT5210 Group 1 — Final Report Preparation & Test Data Tracker

This document consolidates the official project submission guidelines, administrative information, experimental test data templates, and the complete drafting outline for the CSIT5210 Final Report.

---

## 1. Project & Administrative Metadata

- **Project Title:** Evaluating Cold-Start Recommendation Strategies for Volunteer Opportunities
- **Project Type:** Research-oriented Project
- **Group Number:** Group 1
- **Target Word Count:** 5,000 – 10,000 words (Excluding references, appendices, and the separate "Contribution" section)

### 1.1 Team Member Information

| Student ID | Student Name | Research/FYP Supervisor | Own Research / FYP Topic | Distinction Explanation from Project |
| :--- | :--- | :--- | :--- | :--- |
| **21383778** | LIANG, Shuang | N/A | N/A | N/A |
| **21314648** | Zhang, Kaitai | N/A | Android Game Automation Tool | Personal project uses YOLO to detect game objects in real-time and InputManager to simulate touch inputs for game characters. It is completely irrelevant to recommendation systems. |
| **21315159** | Guo, Youjia | N/A | N/A | N/A |
| **21322126** | Wang, Rui | N/A | N/A | N/A |
| **21322009** | Jia, Hansen | N/A | N/A | N/A |

### 1.2 Academic Integrity Declaration Statement
> *"I declare that this group project work is produced solely for this course requirement. This work has not been submitted or used for any other courses, research projects, or assessment purposes."*

---

## 2. Course Submission Guidelines & Checklist

- [ ] **Word Count Check:** 5,000 ~ 10,000 words for Research Type report.
- [ ] **Standard Academic Structure:** Title, Abstract, Introduction, Related Work, System Methodology / Algorithms, Dataset & EDA, Experimental Setup & Results, Discussion / Insights, Threats to Validity, Conclusion, References.
- [ ] **Contribution Section (Mandatory & Separate):**
  - Section title: `Contribution`
  - Does **not** count towards the 5,000–10,000 words total.
  - Exactly one dedicated subsection per group member (**100 – 500 words each**) specifying their concrete technical and writing contributions.
  - *Reminder:* Each member must also submit an individual private online form stating percentage and contribution details.
- [ ] **Zero Hallucination / Real Data Grounding:** All quantitative metrics and case study events must be grounded in the 697 real opportunities in `backend/volunteer.db`.

---

## 3. Human Benchmark Test Data Collection

> **Instructions for Testing:**
> 1. Launch web app at `http://localhost:5173/recommendations`.
> 2. Switch to **"Interactive Human Benchmark Study"**.
> 3. For each test persona (`user_1` to `user_10`), review candidate cards, submit ratings (`👍 Interested`, `👎 Pass`, `⭐ #1 Top Favourite`).
> 4. Click **"Submit Evaluation & Generate Performance Matrix 🎉"**.
> 5. Click **"📋 Copy Markdown Table for Report"** and paste the resulting markdown tables below.

### 3.1 Aggregate Performance Matrix (Summary of All Personas)

*Once you have tested the personas, fill out this summary table with the average scores across participants:*

| Evaluation Metric | Strategy A: TF-IDF Baseline | Strategy B: Dense Embeddings (`all-MiniLM-L6-v2`) | Strategy C: Neural Cross-Encoder (`ms-marco`) |
| :--- | :---: | :---: | :---: |
| **Mean Precision @ 5** | _e.g. 48.0%_ | _e.g. 64.0%_ | _e.g. 84.0%_ |
| **Mean Recall @ 5** | _e.g. 52.0%_ | _e.g. 68.0%_ | _e.g. 88.0%_ |
| **Mean NDCG @ 5** | _e.g. 0.512_ | _e.g. 0.684_ | _e.g. 0.891_ |
| **Mean Reciprocal Rank (MRR)** | _e.g. 0.625_ | _e.g. 0.780_ | _e.g. 0.950_ |
| **Average Latency (ms)** | _~ 2.5 ms_ | _~ 18.0 ms_ | _~ 110.0 ms_ |
| **Computational Footprint** | Extremely Low (CPU) | Low (CPU / RAM) | Moderate (Cross-Attention) |

---

### 3.2 Individual Persona Evaluation Logs (Paste Raw Tables Here)

#### Persona 1: `user1@connect.ust.hk` — Sarah Chan (Animal Welfare)
- **Primary Preferences:** Animal Welfare, Animals, HK Island & NT, $\le 6.0\text{h}$, Cantonese + First Aid
- **Evaluation Status:** ✅ Completed

```markdown
### Personal Recommendation Evaluation Matrix
**Evaluator:** Sarah Chan (Animal Welfare) (`user_1`) | **Causes:** Animal Welfare | **Max Duration:** 6h
**Total Candidates Evaluated:** 14 | **Marked Interested:** 4

| Evaluation Metric | Strategy A: TF-IDF | Strategy B: Embeddings | Strategy C: Cross-Encoder |
| :--- | :---: | :---: | :---: |
| **Precision @ 5** | 40% | 20% | 40% |
| **Recall @ 5** | 50% | 25% | 50% |
| **NDCG @ 5** | 0.19 | 0.117 | 0.633 |
| **Mean Reciprocal Rank (MRR)** | 1 | 1 | 1 |
| **Retrieved in Top-5** | 2 / 5 | 1 / 5 | 2 / 5 |
| **Latency (ms)** | 8.4 ms | 27.84 ms | 1073.49 ms |

#### Evaluated Opportunities Breakdown
- **"Help and Deliver Your Care at Paws United Charity Dog Adoption Centre"** [Your Verdict: **👍 Interested**] → TF-IDF: Missed | Embedding: #1 | Cross-Encoder: #1
- **"Help at animal shelter in Yuen Long (Youth Welcome)"** [Your Verdict: **⭐ #1 Top Favourite**] → TF-IDF: Missed | Embedding: Missed | Cross-Encoder: #2
- **"Be a Lunch Service Assistant for Families with Special Needs"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: Missed | Cross-Encoder: #3
- **"Be a Health Programme Assistant for People with Special Needs in San Po Kong"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: Missed | Cross-Encoder: #4
- **"Phone call support to 1 elderly individual [PRE-TRAINED VOLUNTEERS ONLY]"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: Missed | Cross-Encoder: #5
- **"Help Ethnic Minority Children with Schoolwork (Primary) in TST"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #2 | Cross-Encoder: Missed
- **"Help Ethnic Minority Children with Schoolwork(Primary) in Tseung Kwan O"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #3 | Cross-Encoder: Missed
- **"Help Ethnic Minority Children with Schoolwork (Primary) in Tuen Mun"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #4 | Cross-Encoder: Missed
- **"Help Primary & Secondary School Kids of Hong Kong's Refugees & Asylum Seekers"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #5 | Cross-Encoder: Missed
- **"Help and Deliver Your Care at Paws United Charity Dog Adoption Centre"** [Your Verdict: **👍 Interested**] → TF-IDF: #1 | Embedding: Missed | Cross-Encoder: Missed
- **"Help at animal shelter in Yuen Long (Youth Welcome)"** [Your Verdict: **👍 Interested**] → TF-IDF: #2 | Embedding: Missed | Cross-Encoder: Missed
- **"Shopping with the Elderly in Tin Shui Wai Centre"** [Your Verdict: **👎 Pass**] → TF-IDF: #3 | Embedding: Missed | Cross-Encoder: Missed
- **"Help Ethnic Minority Children with Schoolwork(Primary) in Tseung Kwan O"** [Your Verdict: **👎 Pass**] → TF-IDF: #4 | Embedding: Missed | Cross-Encoder: Missed
- **"Help Ethnic Minority Children with Schoolwork (Primary) in Tuen Mun"** [Your Verdict: **👎 Pass**] → TF-IDF: #5 | Embedding: Missed | Cross-Encoder: Missed
```

#### Persona 2: `user2@connect.ust.hk` — David Wong (Elderly Care)
- **Primary Preferences:** Health & Wellness, Support and Assistance, Elderly, Kowloon, $\le 2.0\text{h}$, Cantonese
- **Evaluation Status:** ✅ Completed

```markdown
### Personal Recommendation Evaluation Matrix
**Evaluator:** David Wong (Elderly Care) (`user_2`) | **Causes:** Health & Wellness, Support and assistance | **Max Duration:** 2h
**Total Candidates Evaluated:** 7 | **Marked Interested:** 3

| Evaluation Metric | Strategy A: TF-IDF | Strategy B: Embeddings | Strategy C: Cross-Encoder |
| :--- | :---: | :---: | :---: |
| **Precision @ 5** | 60% | 60% | 60% |
| **Recall @ 5** | 100% | 100% | 100% |
| **NDCG @ 5** | 0.728 | 0.534 | 0.728 |
| **Mean Reciprocal Rank (MRR)** | 1 | 1 | 1 |
| **Retrieved in Top-5** | 3 / 5 | 3 / 5 | 3 / 5 |
| **Latency (ms)** | 5.58 ms | 28.91 ms | 1008.93 ms |

#### Evaluated Opportunities Breakdown
- **"Play Board Game with the Elderly in Kowloon Bay"** [Your Verdict: **👍 Interested**] → TF-IDF: #1 | Embedding: #1 | Cross-Encoder: #1
- **"Accompany the elderly to join the Art Craft Workshop"** [Your Verdict: **⭐ #1 Top Favourite**] → TF-IDF: #2 | Embedding: #5 | Cross-Encoder: #2
- **"Shopping with the Elderly in Tin Shui Wai Centre"** [Your Verdict: **👍 Interested**] → TF-IDF: #3 | Embedding: #2 | Cross-Encoder: #3
- **"Phone call support to 1 elderly individual [PRE-TRAINED VOLUNTEERS ONLY]"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #3 | Cross-Encoder: #4
- **"LeadOn In-Person Elderly Board Game Training Session"** [Your Verdict: **👎 Pass**] → TF-IDF: #4 | Embedding: Missed | Cross-Encoder: #5
- **"Be a Functional Training Class Assistant for People with Special Needs"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #4 | Cross-Encoder: Missed
- **"Be a Handball Class Assistant for People with Special Needs"** [Your Verdict: **👎 Pass**] → TF-IDF: #5 | Embedding: Missed | Cross-Encoder: Missed
```

#### Persona 3: `user3@connect.ust.hk` — Emily Watson (Youth Tutoring)
- **Primary Preferences:** Education, Children and Youth, New Territories, $\le 2.5\text{h}$, English
- **Evaluation Status:** ✅ Completed

```markdown
### Personal Recommendation Evaluation Matrix
**Evaluator:** Emily Watson (Youth Tutoring) (`user_3`) | **Causes:** Education | **Max Duration:** 2.5h
**Total Candidates Evaluated:** 9 | **Marked Interested:** 4

| Evaluation Metric | Strategy A: TF-IDF | Strategy B: Embeddings | Strategy C: Cross-Encoder |
| :--- | :---: | :---: | :---: |
| **Precision @ 5** | 60% | 40% | 40% |
| **Recall @ 5** | 75% | 50% | 50% |
| **NDCG @ 5** | 0.236 | 0.891 | 0.891 |
| **Mean Reciprocal Rank (MRR)** | 1 | 1 | 1 |
| **Retrieved in Top-5** | 3 / 5 | 2 / 5 | 2 / 5 |
| **Latency (ms)** | 5.89 ms | 22.53 ms | 1102.92 ms |

#### Evaluated Opportunities Breakdown
- **"Help Ethnic Minority Primary Students with Schoolwork in Tin Hau (ENG)"** [Your Verdict: **⭐ #1 Top Favourite**] → TF-IDF: Missed | Embedding: #1 | Cross-Encoder: #1
- **"Help Primary & Secondary School Kids of Hong Kong's Refugees & Asylum Seekers"** [Your Verdict: **👍 Interested**] → TF-IDF: #2 | Embedding: #2 | Cross-Encoder: #2
- **"Christian Action Centre for Refugees Information Session"** [Your Verdict: **👎 Pass**] → TF-IDF: #3 | Embedding: Missed | Cross-Encoder: #3
- **"Be a Mix Media Art Class Assistant for People with Special Needs"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #3 | Cross-Encoder: #4
- **"Be an Oil Pastel Class Assistant for People with Special Needs"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #4 | Cross-Encoder: #5
- **"Be a Handball Class Assistant for People with Special Needs"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #5 | Cross-Encoder: Missed
- **"Help Ethnic Minority Primary Students with Schoolwork in Tin Hau (ENG)"** [Your Verdict: **👍 Interested**] → TF-IDF: #1 | Embedding: Missed | Cross-Encoder: Missed
- **"Packing & sorting food in Tuen Mun for Hong Kong's most vulnerable"** [Your Verdict: **👎 Pass**] → TF-IDF: #4 | Embedding: Missed | Cross-Encoder: Missed
- **"Food Bank Packing, Sorting, Loading for Hong Kong's most vulnerable"** [Your Verdict: **👍 Interested**] → TF-IDF: #5 | Embedding: Missed | Cross-Encoder: Missed
```

#### Persona 4: `user4@connect.ust.hk` — Michael Lee (Food Rescue & Hunger)
- **Primary Preferences:** Food Assistance, Hunger & Homelessness, Low-income / Homeless, HK Island, $\le 2.0\text{h}$, Cantonese
- **Evaluation Status:** ✅ Completed

```markdown
### Personal Recommendation Evaluation Matrix
**Evaluator:** Michael Lee (Food Rescue & Hunger) (`user_4`) | **Causes:** Food Assistance, Hunger & Homelessness | **Max Duration:** 2h
**Total Candidates Evaluated:** 14 | **Marked Interested:** 7

| Evaluation Metric | Strategy A: TF-IDF | Strategy B: Embeddings | Strategy C: Cross-Encoder |
| :--- | :---: | :---: | :---: |
| **Precision @ 5** | 0% | 60% | 100% |
| **Recall @ 5** | 0% | 42.9% | 71.4% |
| **NDCG @ 5** | 0 | 0.699 | 1 |
| **Mean Reciprocal Rank (MRR)** | 0 | 1 | 1 |
| **Retrieved in Top-5** | 0 / 5 | 3 / 5 | 5 / 5 |
| **Latency (ms)** | 4.88 ms | 23.13 ms | 838.33 ms |

#### Evaluated Opportunities Breakdown
- **"Collect Bread for Redistribution - Admiralty (Youth welcome)"** [Your Verdict: **👍 Interested**] → TF-IDF: Missed | Embedding: #4 | Cross-Encoder: #1
- **"Collect Bread for Redistribution - Fortress Hill (Youth welcome)"** [Your Verdict: **👍 Interested**] → TF-IDF: Missed | Embedding: Missed | Cross-Encoder: #2
- **"Collect Bread for Redistribution - Sha Tin Wo Che Plaza (Youth welcome)"** [Your Verdict: **👍 Interested**] → TF-IDF: Missed | Embedding: Missed | Cross-Encoder: #3
- **"Collect Bread for Redistribution - Mong Kok (Youth welcome)"** [Your Verdict: **👍 Interested**] → TF-IDF: Missed | Embedding: Missed | Cross-Encoder: #4
- **"Collect Bread for Redistribution - Whampoa (Youth welcome)"** [Your Verdict: **👍 Interested**] → TF-IDF: Missed | Embedding: Missed | Cross-Encoder: #5
- **"Food Bank Packing, Sorting, Loading for Hong Kong's most vulnerable"** [Your Verdict: **👍 Interested**] → TF-IDF: Missed | Embedding: #1 | Cross-Encoder: Missed
- **"Collect Bread for Redistribution - Sha Tin Yu Chui Shopping Centre"** [Your Verdict: **👍 Interested**] → TF-IDF: Missed | Embedding: #2 | Cross-Encoder: Missed
- **"Save bread for the less fortunate HK Island Wednesdays (Youth Welcome)"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #3 | Cross-Encoder: Missed
- **"Save bread for the less fortunate HK Island Mondays (Youth Welcome)"** [Your Verdict: **👎 Pass**] → TF-IDF: Missed | Embedding: #5 | Cross-Encoder: Missed
- **"Save bread for the less fortunate HK Island Mondays (Youth Welcome)"** [Your Verdict: **👎 Pass**] → TF-IDF: #1 | Embedding: Missed | Cross-Encoder: Missed
- **"Save bread for the less fortunate HK Island Wednesdays (Youth Welcome)"** [Your Verdict: **👎 Pass**] → TF-IDF: #2 | Embedding: Missed | Cross-Encoder: Missed
- **"Save bread for the less fortunate HK Island Fridays (Youth Welcome)"** [Your Verdict: **👎 Pass**] → TF-IDF: #3 | Embedding: Missed | Cross-Encoder: Missed
- **"Save bread for the less fortunate Tsim Sha Tsui Mondays (Youth Welcome)"** [Your Verdict: **👎 Pass**] → TF-IDF: #4 | Embedding: Missed | Cross-Encoder: Missed
- **"Save bread for the less fortunate Tsim Sha Tsui Fridays (Youth Welcome)"** [Your Verdict: **👎 Pass**] → TF-IDF: #5 | Embedding: Missed | Cross-Encoder: Missed
```

#### Persona 5: `user5@connect.ust.hk` — Chloe Cheung (Disability Inclusion & Arts)
- **Primary Preferences:** Support & Assistance, Health & Wellness, Physical Disabilities, Kowloon, $\le 2.0\text{h}$, Cantonese
*Paste copied Markdown table from app here:*
```markdown
<!-- Paste user_5 markdown table here -->
```

#### Persona 6: `user6@connect.ust.hk` — Amina Khan (Ethnic Minorities & Refugees)
- **Primary Preferences:** Education, Support, Ethnic Minorities, Children, New Territories, $\le 3.0\text{h}$, English + Cantonese
*Paste copied Markdown table from app here:*
```markdown
<!-- Paste user_6 markdown table here -->
```

#### Persona 7: `user7@connect.ust.hk` — Kelvin Ho (Environmental Conservation)
- **Primary Preferences:** Environmental Conservation, Waste Reduction, Low-income households, NT, $\le 3.5\text{h}$, Cantonese
*Paste copied Markdown table from app here:*
```markdown
<!-- Paste user_7 markdown table here -->
```

#### Persona 8: `user8@connect.ust.hk` — Jessica Lau (Family Health & Community)
- **Primary Preferences:** Health & Wellness, Families, Children & Youth, HK Island, $\le 2.0\text{h}$, Cantonese
*Paste copied Markdown table from app here:*
```markdown
<!-- Paste user_8 markdown table here -->
```

#### Persona 9: `user9@connect.ust.hk` — Brian Tsang (Special Educational Needs)
- **Primary Preferences:** Education, Support, Special Educational Needs, Kowloon, $\le 2.5\text{h}$, Cantonese
*Paste copied Markdown table from app here:*
```markdown
<!-- Paste user_9 markdown table here -->
```

#### Persona 10: `user10@connect.ust.hk` — Alex Wong (Homeless Outreach)
- **Primary Preferences:** Food Assistance, Hunger & Homelessness, Homeless Rough Sleepers, Kowloon, $\le 1.75\text{h}$, Cantonese
*Paste copied Markdown table from app here:*
```markdown
<!-- Paste user_10 markdown table here -->
```

---

## 4. Final Report Structure & Key Technical Content

### Section 1: Introduction & Problem Formulation
- The volunteer onboarding dilemma: high drop-off rates due to cognitive overload when searching through heterogeneous, unstructured opportunity feeds.
- The user cold-start challenge: collaborative filtering fails without prior user-item interactions ($R \in \mathbb{R}^{U \times I}$ is empty).
- Research Questions formulated in Proposal:
  - **RQ1:** How do sparse TF-IDF vs. dense semantic representations compare in cold-start volunteer matching?
  - **RQ2:** Does two-stage neural reranking (Cross-Encoder / LLM) justify its computational overhead compared to single-stage retrieval?

### Section 2: Related Work
- Content-Based Filtering & Vector Space Models in Recommendation Systems.
- Pre-trained Language Models for Dense Semantic Retrieval (Bi-Encoders e.g., Sentence-BERT).
- Multi-Stage Recommendation Architectures (Retrieval + Rerank) and LLM-assisted RecSys.
- Constraints Satisfaction and Multi-Criteria Filtering in Volunteering Platforms.

### Section 3: System Architecture & Recommendation Algorithms
- **Data Engineering Pipeline:**
  - 697 real opportunities scraped from HandsOn Hong Kong.
  - Textual document synthesis: Title, Organization, Categories, Target Demographic, Description, Requirements.
  - SQLite persistence with normalized relational schemas and BLOB vector storage.
- **Stage 1 Pre-Filtering (Option A Hard Constraints):**
  - Physical Duration Guard: $\text{event.duration} \le \text{user.max\_duration}$.
  - Language / Eligibility Guard: Strict prerequisite matching (Cantonese / English proficiency).
- **Strategy A: TF-IDF Content-Based Baseline:**
  - Sublinear TF scaling, IDF weighting, sparse Cosine Similarity ranking.
- **Strategy B: Dense Semantic Embeddings:**
  - Pre-trained `all-MiniLM-L6-v2` (384-dimensional dense vectors), dot-product semantic affinity.
- **Strategy C: Neural Cross-Encoder Reranker:**
  - Two-stage architecture: Stage 1 retrieves top-$K \times 3$ candidates; Stage 2 applies deep cross-attention (`cross-encoder/ms-marco-MiniLM-L-6-v2`) to joint `(user_profile, event_content)` pairs.

### Section 4: Dataset Exploratory Data Analysis (EDA)
- Total opportunity count: **697 events** across Hong Kong.
- Category Breakdown:
  - Health & Wellness: 190 events
  - Education: 164 events
  - Support & Assistance: 111 events
  - Food Assistance: 109 events
  - Animal Welfare: 40 events (2 unique recurring programs)
  - Waste Reduction & Environmental: 45 events
- Duration Distribution: Right-skewed distribution ranging from 0.75h to 6.0h (mean: 2.35h).
- Geographic Representation: Hong Kong Island, Kowloon, New Territories, and Online/Remote.

### Section 5: Experimental Evaluation & Results
- Pilot study setup with 10 structured persona assessments.
- Evaluation metrics defined mathematically:
  - **Precision@K**: $\frac{|\text{Top-}K \cap \text{Relevant}|}{K}$
  - **Recall@K**: $\frac{|\text{Top-}K \cap \text{Relevant}|}{|\text{Relevant}|}$
  - **Discounted Cumulative Gain (NDCG@K)**: Graded relevance accounting for position decay ($rel=3$ for top pick, $rel=1$ for interested).
  - **Mean Reciprocal Rank (MRR)**: $\frac{1}{\text{rank}_1}$
  - **Inference Latency (ms)**: Measured wall-clock time across strategies.
- Comparative presentation of empirical findings.

### Section 6: In-Depth Discussion & RecSys Insights
1. **Vocabulary Mismatch vs. Semantic Generalization:**
   - How TF-IDF fails when user specifies "animal care" but opportunity is listed under "shelter hygiene" or "dog walking".
2. **The "Constraint Contradiction" Case Study (The Animal Duration Phenomenon):**
   - Analysis of how strict duration pre-filters interact with catalog sparsity (e.g., animal events requiring $\ge 4.0\text{h}$).
3. **Bi-Encoder vs. Cross-Encoder Trade-Off:**
   - Bi-encoders are fast ($O(N)$ dot product) but suffer from semantic entanglement (high false-positive retrieval of general children education events).
   - Cross-encoders perform joint cross-attention ($O(N \cdot L)$), correctly prioritizing high-affinity niche matches at the expense of higher latency.

### Section 7: Threats to Validity & Limitations
- Pilot user sample size vs. large-scale volunteer population.
- Stated onboarding preferences vs. revealed longitudinal participation behaviour.
- Single-portal data provenance (HandsOn Hong Kong).

### Section 8: Conclusion & Future Work
- Summary of findings confirming the efficacy of two-stage neural reranking for cold start.
- Future work: Interactive conversational preference elicitation, multi-turn feedback loops, and multi-objective optimization (balancing user preference with NGO urgent staffing needs).

---

## 5. Member Contributions Section (Template)

*Note: Per course instructions, each member writes between 100 and 500 words. This section does not count towards the 5,000–10,000 word limit.*

### Contribution of LIANG, Shuang (21383778)
*(Write 100–500 words detailing specific project roles, e.g., project proposal drafting, data collection & preprocessing, dataset documentation, evaluation planning, report writing.)*

### Contribution of Zhang, Kaitai (21314648)
*(Write 100–500 words detailing specific project roles, e.g., full-stack system architecture, recommendation algorithms implementation, FastAPI backend services, React + Tailwind UI, benchmark study workflow, report writing.)*

### Contribution of Guo, Youjia (21315159)
*(Write 100–500 words detailing specific project roles, e.g., baseline TF-IDF & dense embeddings pipeline, evaluation metrics implementation, human study testing, report writing.)*

### Contribution of Wang, Rui (21322126)
*(Write 100–500 words detailing specific project roles, e.g., literature review, related work synthesis, cross-encoder neural reranking analysis, report writing.)*

### Contribution of Jia, Hansen (21322009)
*(Write 100–500 words detailing specific project roles, e.g., exploratory data analysis, dataset visualization, experimental result compilation, report writing & proofreading.)*

