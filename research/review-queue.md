# Lessons to revisit

One line per item: `lesson-id`: what changed (source link). Remove the line when the lesson is updated.

- `h1-5`: Today's landscape may need open-weight frontier MoE releases of Oct 2026: Meta Muse Spark Open (816B total, about 42B active; https://huggingface.co/meta-models/Muse-Spark-Open-816B-A42B) and Aleph Alpha Kolibri (78.1B, 3.46B active, Apache 2.0; https://arxiv.org/abs/2610.31945).
- `ar-1`: Mistral Large 4 open weights (about 1.05T total, about 49-52B active, 128 experts, 4 active; reported) is a new large-MoE example (https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B).
- `ar-6`: BYOD (arXiv 2610.41574) reports LoRA-only conversion of AR models (Gemma 2 9B, Llama 3.1 8B, Qwen2.5 7B, Ministral 8B) into diffusion LMs; the lesson may want a cheap-conversion path (https://arxiv.org/abs/2610.41574).
- `rs-2`: parallel agent teams (arXiv 2611.09798) extend best-of-N to multi-step agent work; 10-agent teams beat solo agents on 10 of 12 tasks at a 100-agent budget (reported); consider a short example (https://arxiv.org/abs/2611.09798).
- `sy-7`: Microsoft Research reports a weight-edit backdoor (fewer than 10 dormant neurons) that passes behavioral checks; the guardrails lesson may want a model-supply-chain caveat (https://www.microsoft.com/en-us/research/blog/lazare-veni-foras-reprogramming-dormant-neurons-to-backdoor-ai-agents/).
- `ag-7`: a meta-analysis (arXiv 2611.17610) finds multi-agent setups rarely beat compute-matched single agents (9 studies, 516 configurations); the lesson may want this caveat (https://arxiv.org/abs/2611.17610).
