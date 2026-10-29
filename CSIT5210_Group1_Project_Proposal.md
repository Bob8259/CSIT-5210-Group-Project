# Evaluating Cold-Start Recommendation Strategies for Volunteer Opportunities

## Project Information

- **Project Type:** Research-oriented Project
- **Group No.:** 1

---

# Research Proposal

## 1. Project Overview

Volunteer opportunities and community events are distributed across multiple websites and platforms. Users must often compare events according to their interests, location, schedule, skills, eligibility, and time commitment. A recommendation system can reduce this information burden by identifying opportunities that are relevant to individual users.

Recommendation is difficult when a new user joins the system because historical interactions, such as clicks, ratings, registrations, or previous selections, are limited or unavailable. This challenge is known as the user cold-start problem.

This project investigates cold-start recommendation for volunteer and community events. A short onboarding questionnaire will construct an initial profile of each new user's preferences and participation constraints.

The main objective is to compare conventional content-based, semantic, and large-language-model-based approaches when each receives the same limited user profile.

The project will implement three main recommendation methods:
1. A traditional TF-IDF-based content recommender;
2. A semantic embedding-based recommender; and
3. A retrieval-augmented recommendation method in which a Large Language Model (LLM) reranks retrieved real events according to the user's stated preferences.

The LLM-based approach will rerank candidates drawn from the event dataset, helping to ensure that recommendations remain grounded in available opportunities.

The project will focus on experimental comparison rather than the development of a large-scale production platform.

---

## 2. Background and Motivation

Traditional recommendation systems often depend on interaction history. Collaborative filtering, for example, infers relationships between users and items from previous behaviour and can perform poorly when a new user has little or no historical data.

A practical response to cold start is to collect explicit preference information during onboarding. Rather than waiting for interaction data, a system can use answers about users' interests and participation constraints to construct an initial profile.

For volunteer-event recommendation, these preferences must be meaningfully matched to attributes in the available event catalog.

A traditional content-based method can use TF-IDF and cosine similarity to compare profiles with event descriptions. Although efficient and interpretable, it depends heavily on lexical overlap; semantically related interests and events may use different vocabulary.

Semantic embeddings can address this limitation by encoding profiles and event descriptions as dense vectors that capture conceptual relationships beyond exact keyword overlap.

However, a single similarity score may not fully represent preferences that include several simultaneous interests and constraints.

Large Language Models (LLMs) can interpret natural-language preferences and reason about multiple conditions. However, direct generation of recommended events may produce nonexistent opportunities or unsupported assumptions.

The project therefore considers a retrieval-augmented LLM reranking approach, in which an LLM assesses candidates supplied from the dataset rather than independently generating events. The study will determine whether this approach provides additional value beyond conventional retrieval-based recommendation.

---

## 3. Research Aim and Questions

This project investigates whether retrieval-augmented LLM reranking can improve recommendation quality for new users when only limited explicit preference information is available.

The project will address the following research questions:

- **RQ1:** How do traditional TF-IDF-based profile matching and semantic embedding-based recommendation perform in a cold-start volunteer-event recommendation setting using the same onboarding preference profile?
- **RQ2:** Does retrieval-augmented LLM reranking improve recommendation quality compared with conventional similarity-based recommendation when all methods are given the same initial user information?

The methods will receive consistent user input so that differences in recommendation quality can be attributed to the recommendation approach.

---

## 4. Data Collection and Preparation

The project will construct an educational dataset of volunteer opportunities and community events from selected public sources. Official APIs or public data feeds will be preferred; any website collection will consider relevant terms of use and access policies.

Each event will be converted into a standardized representation containing, where available:
- event title;
- event description;
- organizer;
- category;
- location;
- date and schedule;
- required skills;
- duration;
- eligibility requirements; and
- other useful participation constraints.

Data preparation will include duplicate removal, normalization of dates and categories, handling of incomplete records, and removal of outdated or unsuitable events.

Two event representations will be constructed:
- **Textual content** based on titles, descriptions, categories, and other useful text fields; and
- **Structured metadata**, such as location, schedule, duration, and eligibility.

These representations will support recommendation and filtering.

The onboarding questionnaire will be designed after examining the available event attributes and will include only preference dimensions that can be matched meaningfully to the catalog.

The event catalog will provide the recommendation items, while user preference profiles and relevance judgments will be collected separately during evaluation. This design does not require an existing interaction dataset.

---

## 5. Recommendation Methods

### 5.1 TF-IDF Content-Based Baseline
The first method will provide a simple, interpretable baseline. Questionnaire responses will be converted into a textual profile, and TF-IDF vectors with cosine similarity will be used to rank event documents. Where suitable, shared structured filters will be applied before ranking.

### 5.2 Semantic Embedding Recommendation
The second method will represent the same user profile and event descriptions with dense embeddings generated by a pretrained language model. Events will be ranked by semantic similarity, providing a baseline that can capture relationships beyond exact keyword overlap.

### 5.3 Retrieval-Augmented LLM Reranking
The third method is the main research extension of the project.

Instead of applying an LLM to the complete event catalog, the semantic retrieval system will first identify a relatively small set of candidate events.

The process can be summarized as follows:

$$\text{Onboarding Preference Profile} \longrightarrow \text{Candidate Retrieval} \longrightarrow \text{LLM Reranking} \longrightarrow \text{Final Top-}K\text{ Recommendations}$$

The LLM will receive the same user preference information used by the baseline methods together with structured descriptions of the retrieved candidate events. It will then evaluate how well each candidate satisfies the user's interests and constraints and produce a revised ranking.

For example, the model may consider several preferences simultaneously, such as activity type, topic interest, availability, location, and time commitment, rather than reducing the entire user profile to a single similarity score.

Importantly, the LLM will only be allowed to rank retrieved event records. It will not generate new volunteer opportunities. This keeps the recommendation process grounded in the available dataset and reduces the risk of recommending nonexistent events.

The LLM output will use a predefined structured format so that rankings can be automatically processed and evaluated.

---

## 6. Experimental Design and Evaluation

The system will be evaluated through a small-scale offline pilot study involving members of the project team.

Each participant will complete the same short onboarding questionnaire, and the resulting cold-start profile will be supplied to all three methods.

Before viewing any recommendation results, participants will independently assess a subset of real events using a simple relevance scale, such as interested, neutral, and not interested. These judgments will provide the relevance labels for evaluation.

The following methods will be compared:
1. TF-IDF-based profile matching;
2. Semantic embedding-based recommendation; and
3. Semantic retrieval followed by LLM reranking.

All methods will use the same initial profile and event catalog and, where possible, comparable candidate sets and shared hard filtering rules.

Evaluation will focus on **Recall@K** and **NDCG@K**.
- **Recall@K** measures whether relevant events appear among the top recommendations.
- **NDCG@K** accounts for their ranking positions.

Participant ratings of recommendation usefulness may be collected as supplementary evidence where feasible. Because the evaluation involves only a small number of project-team members, the results will be interpreted as a pilot evaluation rather than evidence of general user-population performance.

---

## 7. Analysis

The analysis will compare the performance of the proposed recommendation approaches under the same cold-start conditions.

Evaluation results will be summarized using appropriate ranking metrics and participant relevance judgments. The analysis will examine whether meaningful differences in recommendation quality are observed across the approaches.

Selected examples of differing recommendation results may also be reviewed to support interpretation of the quantitative findings.

The findings will be interpreted while considering the dataset size, participant sample, and limitations of the evaluation.

---

## 8. Expected Contributions

The project will provide an empirical comparison of recommendation approaches in a volunteer-event cold-start setting. It will assess whether retrieval-augmented LLM reranking can improve ranking quality while remaining grounded in real events. It will also evaluate these approaches using a realistic onboarding profile rather than an existing interaction history.

---

## 9. Limitations

The event dataset may be small or incomplete, and the participant sample may limit the generalizability of the findings. The questionnaire will capture only part of a user's preferences, while real volunteering decisions may depend on unrepresented factors. Participant judgments will represent stated preferences rather than long-term behaviour. LLM reranking may also introduce latency, cost, output variability, or errors in interpreting preferences and event constraints. These limitations will be documented when interpreting the results.

---

## 10. Expected Outcome

The final project will deliver a recommendation prototype and an experimental evaluation report. It will provide evidence on whether the proposed approach offers meaningful benefits for volunteer-event recommendation under cold-start conditions.

Adaptive recommendation based on later feedback, interactive recommendation agents, and long-term preference learning are potential future extensions beyond the scope of this project.

