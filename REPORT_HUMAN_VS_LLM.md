# Human vs LLM labels on the same spot-check pairs

- Source: `C:\Users\25847\Desktop\Acdamic_related\Data Mining and Knowledge Discovery\Project\Recommendation_system\CSIT-5210-Group-Project\evaluation\test_dataset\human_validation\spotcheck_multi_user.json`
- Users: 13 | pairs: 260 | items per user: 20
- Candidate set: the same 20 human-labeled items per user
- Metric subject: label == 2 (interested)
- Rankings are computed once and evaluated twice, against human labels and LLM labels.

## Label agreement

| Metric | Value |
| :--- | ---: |
| Exact match | 58.5% |
| Within-one agreement | 94.2% |
| Cohen's kappa | 0.3289 |
| Quadratic weighted kappa | 0.5392 |

Human distribution: {0: 136, 1: 66, 2: 58} | LLM distribution: {0: 129, 1: 77, 2: 54}

## Metrics: human vs LLM labels

| Method | K | Human normR | LLM normR | Δ | Human NDCG | LLM NDCG | Δ |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| TF-IDF | 5 | 0.6385 | 0.7372 | +0.0987 | 0.6951 | 0.7637 | +0.0686 |
| TF-IDF | 10 | 0.6992 | 0.8981 | +0.1989 | 0.7271 | 0.7918 | +0.0647 |
| Embedding | 5 | 0.5513 | 0.5833 | +0.0321 | 0.5646 | 0.6083 | +0.0436 |
| Embedding | 10 | 0.6607 | 0.7590 | +0.0983 | 0.6135 | 0.6520 | +0.0384 |
| Cross-Encoder | 5 | 0.5462 | 0.5808 | +0.0346 | 0.5792 | 0.5846 | +0.0054 |
| Cross-Encoder | 10 | 0.6690 | 0.7904 | +0.1214 | 0.6373 | 0.6290 | -0.0083 |

## Ranking by NDCG@5

| Rank | Human labels | LLM labels |
| ---: | :--- | :--- |
| 1 | TF-IDF | TF-IDF |
| 2 | Cross-Encoder | Embedding |
| 3 | Embedding | Cross-Encoder |

## Per-user NDCG@5 winner

| Label source | Winners | Ties |
| :--- | :--- | ---: |
| human | TF-IDF 6, Cross-Encoder 4, Embedding 2 | 1 |
| llm | Embedding 1, TF-IDF 9, Cross-Encoder 1 | 2 |

## Interpretation

The candidate set and the model scores are identical in both columns; only the relevance labels change. Any difference in the ranking therefore comes from the label source rather than from the retrieval or ranking pipeline. The 20 items per user come from a random spot-check sample; the comparison is descriptive because the number of users is small.

## Caveats

- Only 13 users and 260 pairs are available.
- The 20 items were selected as a random spot-check sample, not as the full 112-item catalogue.
- Human and LLM labels have different per-user positive counts, so absolute metric differences partly reflect label prevalence.
- With so few users, pairwise significance is very limited; the ranking is descriptive.