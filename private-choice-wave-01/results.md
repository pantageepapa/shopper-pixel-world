# Private choice wave 1

On 25 November 2026, 24 synthetic adult shoppers based in Germany each made one private choice and gave a brief reason via MiroFish OASIS with `gpt-4.1-mini`. The batch returned 24 usable responses. The runner recorded zero feed rounds, zero posts and zero comments. Each of the four card orders was shown to six shoppers, and each product appeared in each position six times.

| Recorded outcome | Count | Share |
| --- | ---: | ---: |
| Jack Wolfskin Prelight Crew | 12 | 50.0% |
| nozzle quiz Essential Kite L/S Tee | 11 | 45.8% |
| Patagonia P-6 Logo Responsibili-Tee | 1 | 4.2% |
| Odlo Zeroweight Chill-Tec Crew Neck L/S | 0 | 0% |
| None | 0 | 0% |
| Undecided | 0 | 0% |

## Budget breakdown

| Synthetic maximum budget | Jack Wolfskin | nozzle quiz | Patagonia |
| --- | ---: | ---: | ---: |
| €45 | 6 | 0 | 0 |
| €55 | 6 | 0 | 0 |
| €65 | 0 | 5 | 1 |
| €85 | 0 | 6 | 0 |

All 12 Jack Wolfskin selectors cited price or budget. Jack Wolfskin was the only shirt within the €45 budget. Odlo was also within the €55 budget. All four shirts were within the €65 and €85 budgets, and 11 of those 12 profiles picked nozzle quiz. In its 11 stated reasons, nine mentioned thumb openings and seven mentioned quick drying. Six mentioned its slate gray color, and three mentioned the rear pocket. The one Patagonia selection cited the cotton blend and appearance.

## Card-order breakdown

| Card order | Jack Wolfskin | nozzle quiz | Patagonia |
| --- | ---: | ---: | ---: |
| A B C D | 3 | 3 | 0 |
| B C D A | 4 | 1 | 1 |
| C D A B | 3 | 3 | 0 |
| D A B C | 2 | 4 | 0 |

A = nozzle quiz, B = Jack Wolfskin, C = Odlo, D = Patagonia.

## Interpretation and provenance

The budget caps were deliberately assigned at €45, €55, €65 and €85, six profiles per cap. These synthetic caps and the profile mix are design inputs. The overall split depends on that mix. A profile's cap is a scenario assumption, so the results do not estimate willingness to pay or German market demand. The model saw German text descriptions, including visible attributes described in words. Its choices reflect those descriptions and frozen reference prices, with identical size availability and checkout terms stipulated in the task. The exercise used one model and 24 synthetic shoppers. Odlo's zero is limited to this particular comparison.

The [manifest](manifest.json) contains the frozen cards, prices, terms, profiles and assignments. The [response file](responses.jsonl) preserves all 24 original replies and exact interview prompts. Every saved reply was cross-checked against the MiroFish IPC result and SQLite interview trace. One early launch stopped on a required profile-metadata field before interviews started. After setting the required metadata to unspecified, one private batch completed.
