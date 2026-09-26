# RetailEdge AI — Market & Technology Research Brief

**For Problem Statement SIH26179 (Qualcomm Inc) — AI-powered retail intelligence platform (edge AI, shopper analytics, inventory visibility, queue management)**

*Research compiled September 2026. Every important figure is sourced; analyst estimates are flagged as estimates.*

---

## 1. Executive Summary

1. **The market is real and growing fast.** In-store analytics is a ~$5–8B market today growing at ~16–24% CAGR; computer-vision-in-retail alone is forecast to reach $12.6B by 2033. India's retail sector is ~$1.1T (2025) with 12–15M kirana stores, and organized retail is only ~18–20% of the market — huge headroom for technology adoption.
2. **The problem economics justify the product.** Global stockouts cost retailers ~$1.2T/yr in lost sales (~4% of revenue per retailer); average stockout rate is ~8%. Shrinkage adds another ~1.5% of sales. A product that measurably cuts stockouts and queue wait has a defensible ROI pitch to store owners.
3. **The competitive field is crowded but misaligned with this problem statement.** Trax ($1.07B raised), Focal Systems, AiFi, Trigo, Zippin and others do shelf/people analytics — but almost all are cloud-centric, enterprise-priced, and Western-market-focused. The explicit gap is **offline-first, low-cost, privacy-by-architecture analytics for Indian Tier-2/Tier-3 stores**. Closest analogues: Nodeflux (Indonesia, on-premise, privacy-first) and Wesense.ai (India, CCTV integration).
4. **The Qualcomm sponsorship is a strategic signal.** This is a Qualcomm problem statement. Qualcomm's own edge stack — QCS6490 (12 TOPS NPU, 5 concurrent cameras), the Edge AI Box, and the December 2025 **Qualcomm Insight Platform** (edge-first VSaaS with exactly these retail analytics) — should anchor the hardware/architecture story. The current plan's NVIDIA Jetson choice works technically, but a Qualcomm-anchored tier is a differentiator for *this* hackathon.
5. **Privacy is now a legal differentiator, not just a design principle.** DPDP Rules were finalized Nov 13, 2025, explicitly cover AI-enabled CCTV, and full compliance is due May 13, 2027 with penalties up to ₹250 Cr. The blueprint's no-face, metadata-only, local-processing architecture is exactly what the law now rewards.
6. **Recommendation:** Keep the blueprint's edge-first architecture, but (a) add a Qualcomm QCS6490 reference tier to the BOM and pitch, (b) lead the hackathon narrative with the DPDP-compliance + offline-first moat rather than generic "AI for retail," and (c) target modern trade / small supermarkets first (₹18–45k hardware) before kirana (price-sensitive).

---

## 2. Key Findings

### 2.1 Market sizing — global

| Metric | Value | Source (year) |
|---|---|---|
| Computer vision AI in retail | $1.7B (2024) → $2.5B (2025) → $12.6B (2033), ~22% CAGR | Grand View Research (2025) |
| In-store analytics | $5.29B (2025) → $15.98B (~2031) | Mordor Intelligence (Aug 2026) |
| Store analytics (CV) | $8.4B (2025) → $32.6B (2034), 16.2% CAGR | DataIntelo (2025) |
| Retail analytics (all) | $10.2B (2025) → $37.18B (2034) | Fortune Business Insights (2025) |
| Computer vision for retail | $4.23B (2025) → $5.24B (2026), 23.8% CAGR | Research and Markets (2026) |

*Caveat: these are analyst estimates with wide variance between houses (definitions differ — "store analytics CV" vs "in-store analytics" vs "retail analytics" overlap). Use ranges, not single numbers, in the pitch.*

### 2.2 India context

- India retail market: **US$1,093.89B (2025)** → projected **US$2,361.11B by 2030**; organized retail expected to capture **>35%** (IBEF).
- **12–15 million kirana stores** (multiple sources; Cornell/IBEF ~13M). Kiranas historically managed ~75–88% of retail trade; organized share is rising from ~18–20% toward 25–30% (Indian Retailer, Invest India).
- Cornell (May 2026): transforming just **10% of India's 13M kirana stores could boost retail consumption >5% and create ~3.2M jobs** — strong "why now" / national-impact framing for a hackathon.
- Kirana digital adoption is underway (UPI QR, quick-commerce tie-ups, digitized billing) but POS/inventory digitization remains shallow — meaning **many target stores have no inventory system at all, which is exactly the gap a camera-based inventory layer fills** (no integration prerequisite).

### 2.3 The problem economics (ROI case)

- **Stockouts:** global lost-sales estimate **~$1.2T/yr** (Mirakl, OpenSend, 2025); **$1.7T** including overstocks ("inventory distortion", GoodsOrder, 2026). Average stockout rate **~8%** (NetSuite); out-of-stocks cost the average retailer **~4.1% of revenue** (Retail Wire via vndly, 2026).
- **Shrinkage:** ~**1.4–1.6% of sales** (NRF benchmark); global shrink **~$132B in 2024**; 2024 rate 1.68% was a 10-year high (Building Security, dohassist). Employee theft ≈ 29% of shrink (NRF via NetSuite).
- **Queue/wait:** brainyneurals (vendor) claims CV retail systems deliver 96% counting accuracy, 50% shrinkage reduction, 45% shorter queue waits — treat as marketing, but consistent with the category's claims.

*→ The plan's P4 targets (stockouts ↓ ≥30%, avg wait ↓ ≥25%) are conservative against these benchmarks and credible to judges.*

### 2.4 Competitive landscape

| Company | Focus | Funding/traction | Notes |
|---|---|---|---|
| **Trax** | Shelf/planogram image recognition, merchandising analytics | ~$1.07B raised (SoftBank-led $640M Series E, 2021); ~$79.8M revenue (Latka) | Global leader; cloud-centric, enterprise pricing; strong in CPG/FMCG |
| **Focal Systems** | Edge cameras for shelf availability, auto-replenishment | ~$28–42M raised | **Edge-based** (cameras in-store), closest philosophical analogue; US retail focus |
| **AiFi** | Autonomous checkout (camera-based) | $65M Series B (2022; Aldi, Zabka investors) | Adjacent (checkout automation, not analytics) |
| **Trigo** | Autonomous stores (grocery) | — | Adjacent; heavy per-store install |
| **Zippin** | Autonomous checkout | — | Adjacent |
| **alwaysAI** | Edge AI platform for retail CV | — | Platform play; edge inference |
| **Nodeflux** | On-premise AI: footfall, heatmaps, loss prevention | Indonesian | **On-premise, privacy-first people counting** — closest to our positioning |
| **Wesense.ai** | Real-time customer analytics via existing CCTV | Indian startup (StartUs) | India, CCTV-integration angle |
| **NOVA / Viso / Irida Labs** | CV providers for retail | — | Turnkey platforms; cloud-heavy |

**Gap analysis (opportunity):** No major player combines (a) fully offline edge inference, (b) DPDP-native privacy, (c) low price point for Indian modern trade + kirana, and (d) all three modules (shopper + shelf + queue) in one box. Trax is cloud + enterprise; Focal is edge but US-market and shelf-only; Nodeflux is SE-Asia and security-centric.

### 2.5 Edge hardware landscape (validates the plan's tiers)

| Platform | AI performance | Cameras | Notes |
|---|---|---|---|
| **Qualcomm QCS6490** (Edge AI Box / Dragonwing) | **12 dense TOPS NPU**; 30–50 concurrent AI threads; 5 concurrent cameras, 4K60 decode | 5+ | **Qualcomm's flagship edge-IoT SoC**; directly relevant to this Qualcomm PS; Linux/Android; used in VVDN/Inventec/OnLogic edge boxes |
| Qualcomm QCS610/QCS410 | Lower-tier TOPS (2020-era) | 2–4 | Older Vision Intelligence Platform; budget tier |
| NVIDIA Jetson Orin Nano | 40 TOPS (INT8, dense) with TensorRT; 6–8 streams | 4–8 | Current plan's mid tier; strong DeepStream ecosystem |
| Raspberry Pi 5 + Hailo-8L | **26 TOPS**; ~120 ms/frame on YOLOv10x class models | 2–4 | Budget tier (₹18–25k); validated by community benchmarks (Hailo forum, Reddit) |
| Jetson Nano Super (2024) | ~$350 dev kit | — | Recent budget option |

*Key hardware takeaways:*
- The plan's three-tier BOM (RPi5+Hailo / Orin Nano / Orin NX) is validated by real community benchmarks — the budget tier genuinely works at 10–15 FPS.
- **Qualcomm QCS6490 slots naturally between the budget and mid tiers** (12 TOPS, 5 cameras) and has the sponsor-alignment advantage. Edge boxes based on it (VVDN, Inventec AIM-Edge QC01, OnLogic) are commercially available in India.
- Qualcomm's **Insight Platform** (announced Dec 2025) is an edge-first VSaaS with retail analytics (peak traffic hours, queue lengths, staffing efficiency) — evidence that Qualcomm itself sees this exact use case; citing it shows the solution rides Qualcomm's own roadmap.

### 2.6 Regulatory — DPDP Act & Rules (privacy is now a moat)

- **DPDP Act 2023** (enacted Aug 11, 2023) + **DPDP Rules finalized Nov 13, 2025**; full compliance deadline **May 13, 2027** (18-month phase-in); Data Protection Board of India established Nov 2025.
- **AI-enabled CCTV cameras are explicitly covered** under the DPDP Rules (government confirmation, 2025).
- Key obligations: standalone privacy notices, consent with easy withdrawal, breach notification to DPB + affected individuals within 72 hours, data minimization, deletion when purpose ends, security safeguards, processor contracts, grievance handling ≤90 days.
- **Penalties: up to ₹250 Cr (~$30M)** for failing security safeguards; ₹200 Cr for breach-notification failures; ₹50 Cr for other violations.
- **No lawful-basis menu like GDPR** — consent + limited legitimate uses only. Video of identifiable shoppers is personal data; **processing on-device without storing raw video, without face recognition, and transmitting only anonymized metadata is the lowest-risk architecture available** — precisely what the blueprint proposes.

*→ This turns the privacy section from "nice-to-have" into a compliance differentiator that enterprise/chain customers (and judges) can't ignore, and it hardens the offline-first argument: less data leaves the store = less DPDP exposure.*

---

## 3. Implications for the RetailEdge AI Solution (blueprint + plan)

1. **Add a Qualcomm reference tier.** BOM becomes: Budget = RPi5 + Hailo-8L; **Qualcomm = QCS6490 Edge AI Box (sponsor-aligned, 12 TOPS, 5 cams)**; Large = Orin NX. Cite Qualcomm Insight Platform as proof the architecture matches the sponsor's own direction.
2. **Lead with the offline-first + DPDP-native story.** The competition (Trax, cloud players) cannot match "zero cloud dependency + zero video retention + DPDP-compliant by construction." This is the differentiator to open the pitch with.
3. **Frame ROI with sourced numbers.** Stockout rate ~8%, ~4% revenue lost to OOS, ~1.5% shrinkage, plus queue-wait conversion impact → target metrics in the plan (OOS ↓30%, wait ↓25%) are conservative and defensible.
4. **Segment the go-to-market.** Modern trade / small supermarkets first (hardware fits their budget and staff workflows); kirana is a later, lighter-touch SKU (share-hardware or subsidized model) — matches the plan's P4 pricing tiers.
5. **Sharpen the "no inventory system" insight.** Because many target stores lack POS/inventory systems, the camera-based inventory layer is the *entry point*, not an integration. POS/ERP integration (Tally, Zoho, SAP) remains the upgrade path as planned.
6. **Verify accuracy targets against published reality.** Vendor claims like "96% counting accuracy" are marketing; published academic/industry benchmarks for retail people counting under occlusion/lighting stress are lower. Keep the plan's honest targets (entry/exit MAE ≤2%, OOS P/R ≥0.90/0.85) and the shadow-mode validation protocol — they're already the right discipline.

---

## 4. Risks & Caveats

- **Analyst market numbers are estimates with wide variance** across firms; don't quote a single precise CAGR without showing the range.
- **The $1.2T stockout figure is a widely-cited global estimate, not an audited metric** — use it as directional framing, prefer per-retailer percentages (~4% revenue, ~8% rate) for defensibility.
- **Competition is well-funded** (Trax $1.07B). The India offline-first niche is the defensible wedge, but global players could enter; speed-to-pilot and store-owner references matter.
- **Kirana price sensitivity is real.** ₹18k+ hardware remains a stretch for many kirana owners; the near-term TAM is modern trade, small supermarkets, and pharmacy chains, not all 13M kiranas.
- **Edge accuracy under Indian retail conditions** (low light, crowds, mannequins, reflections) is the #1 technical risk — the plan's hard-example mining and per-store threshold tuning are the right mitigations; no published vendor claim should be trusted without local validation.
- **DPDP enforcement timing:** full enforcement is May 2027; early mover on compliance is a feature now, but the regulatory regime may evolve (consent-manager framework operational Nov 2026).

---

## 5. Recommendation

1. **Proceed with the existing blueprint/plan** — the architecture (edge inference, metadata-only sync, M/M/c queue model, three-tier BOM) is validated by market and hardware research.
2. **Make three targeted changes:**
   - Add **Qualcomm QCS6490** as the sponsor-aligned reference tier and weave the Qualcomm Insight Platform into the narrative.
   - Elevate **DPDP compliance + offline-first** from a design note to the primary positioning and pitch opener.
   - Add the sourced **ROI framing** (stockout ~8%/~4% revenue, shrinkage ~1.5%) to the KPI targets so the business case is quantified.
3. **Near-term focus:** modern trade + small supermarkets pilot (as planned), with kirana as the follow-on tier.

---

## 6. Sources

**Market sizing**
- Grand View Research — Computer Vision AI in Retail Market Report 2025–2033: https://www.grandviewresearch.com/industry-analysis/computer-vision-ai-retail-market-report
- Mordor Intelligence — In-Store Analytics Market (Aug 2026): https://www.mordorintelligence.com/industry-reports/in-store-analytics-market
- DataIntelo — Store Analytics Computer Vision Market: https://dataintelo.com/report/store-analytics-computer-vision-market
- Fortune Business Insights — Retail Analytics Market: https://www.fortunebusinessinsights.com/industry-reports/retail-analytics-market-101273
- Research and Markets — Computer Vision for Retail Market Report 2026: https://www.researchandmarkets.com/reports/6215190/computer-vision-retail-market-report

**India context**
- IBEF — Retail Industry in India: https://www.ibef.org/industry/retail-india
- Cornell SC Johnson (May 2026) — India's digital pull revolution / 13M kirana stores: https://business.cornell.edu/centers/2026/05/13/indias-digital-pull-revolution/
- Invest India — Modernization of Kirana Stores: https://www.investindia.gov.in/team-india-blogs/modernization-kirana-stores-india
- ACR Journal (2025) — Retailers and UPI in India: https://acr-journal.com/article/retailers-and-upi-in-india-a-systematic-review-of-adoption-barriers-and-opportunities-1952/

**Problem economics**
- Mirakl — The $1.2T problem: out-of-stocks: https://www.mirakl.com/blogs/marketplace/out-of-stocks-ecommerce-inventory-management-problem/
- OpenSend — Stock-out rate statistics: https://www.opensend.com/post/inventory-stock-out-rate-statistics
- NetSuite — Stockouts Defined: https://www.netsuite.com/portal/resource/articles/inventory-management/stockout.shtml
- vndly — Bad inventory management costs ($1.77T, 4.1% OOS): https://www.vndly.io/blog/true-cost-of-bad-inventory-management-2026
- NRF — Impact of Retail Theft & Violence 2025: https://nrf.com/research/the-impact-of-retail-theft-violence-2025
- Building Security — Retail Theft & Shrinkage Statistics 2026 ($132B): https://www.buildingsecurity.com/statistics/retail-theft/
- invue — Retail Shrinkage Statistics (1.4–1.6% benchmark): https://invue.com/resource-center/blog/6-retail-shrinkage-statistics

**Competitive landscape**
- Tracxn — Computer Vision in Retail startups (124 companies): https://tracxn.com/d/trending-business-models/startups-in-computer-vision-in-retail/__1eP6zqXPFtMncB3sHJFTahm1ImaM8OMTDM8B6jB_-ww/companies
- Bouncewatch — Focal Systems vs Trax Retail funding comparison ($41.9M vs $1.07B): https://bouncewatch.com/compare/focal-systems/trax-retail
- Trax — $640M Series E (2021): https://traxretail.com/blog/visionary-investors-back-trax-with-640-million-in-new-funding/
- TechCrunch — AiFi $65M Series B (2022): https://techcrunch.com/2022/03/11/aifi-autonomous-retail-series-b/
- StartUs — Retail analytics startups incl. Wesense.ai: https://www.startus-insights.com/innovators-guide/retail-analytics-startups/
- Nodeflux — On-premise retail AI: https://www.nodeflux.ai/solutions/retail

**Hardware / Qualcomm**
- Qualcomm — Edge AI Box / Vision Edge AI: https://www.qualcomm.com/artificial-intelligence/edge-ai-box
- Qualcomm — Insight Platform (edge-first VSaaS, Dec 2025): https://www.qualcomm.com/news/onq/2025/12/qualcomm-insight-platform-edge-ai-video-saas
- Qualcomm — Insight Platform for Retail (PDF): https://www.qualcomm.com/content/dam/qcomm-martech/dm-assets/documents/Insight-Platform_Retail.pdf
- Silex — QCS6490 features (12 TOPS, 5 cameras): https://www.silextechnology.com/unwired/qualcomm-qcs6490-features-benefits-edge-ai-applications
- Qualcomm IoT Hardware (Dragonwing; AI Box 6490, 30–50 AI threads): https://www.qualcomm.com/internet-of-things/hardware
- Qualcomm — QCS610/QCS410 launch: https://www.qualcomm.com/news/onq/2020/07/bringing-ai-edge-smart-cameras-internet-things
- Hailo community — RPi5 + Hailo-8L benchmarks: https://community.hailo.ai/t/raspberry-pi-5-with-hailo-8l-benchmark/746
- Ultralytics forum — Jetson vs RPi5+Hailo: https://community.ultralytics.com/t/jetson-nano-vs-raspberry-pi5-8g-hailo-26-top/532

**Privacy / regulatory**
- Fisher Phillips (Feb 2026) — DPDP Rules, compliance deadlines, penalties: https://www.fisherphillips.com/en/insights/insights/indias-new-data-privacy-rules-are-here
- Linklaters — Data Protected India (Act Aug 2023, Rules Nov 13 2025): https://www.linklaters.com/en/insights/data-protected/data-protected---india
- LinkedIn/Sujeet Katiyar — AI-enabled CCTV covered under DPDP Rules: https://www.linkedin.com/posts/sujeetkatiyar_ai-enabled-cctv-cameras-will-be-covered-under-activity-7447658115954581504-VA7v