/* The whole syllabus. Lessons with `ready: true` have a page in /lessons/<id>.html.
   Anything else renders as "coming soon" on the course map.
   `pre` lists a lesson's immediate prerequisites (always earlier in course order);
   learning paths follow them. Module `tags` feed the weekly research pipeline. */
window.LC = window.LC || {};

LC.config = {
  // Colab "Open in Colab" links point at notebooks in this GitHub repo + branch.
  repo: "abhishekaryan23/LLM-Learner",
  branch: "main",
  notebookDir: "course/notebooks",
  reviewed: "2026-10"   // default "last reviewed" month for lessons without their own
};

LC.course = {
  title: "LLMs From Basics",
  tracks: [
    {"id": "start", "title": "Start here", "note": "How to learn, and the story of how we got here.", "modules": ["m0", "h1"]},
    {"id": "prereq", "title": "Prerequisites", "note": "Already solid on a topic? Try its quiz first. If you ace it, move on.", "modules": ["p1", "p2", "p3", "p4", "p5", "p6"]},
    {"id": "core", "title": "Language models", "modules": ["m1", "m2", "m3", "m4", "m5", "ar", "cap"]},
    {"id": "beyond", "title": "Beyond text", "note": "Images, sound, video and models that mix them.", "modules": ["v1", "g1", "a1", "mm", "vd"]},
    {"id": "rlrs", "title": "Reinforcement learning & reasoning", "modules": ["rl", "rs"]},
    {"id": "build", "title": "Building with LLMs", "modules": ["sy", "ag", "in", "cx"]}
  ],
  goals: [
    {"id": "llm", "title": "Understand LLMs from scratch", "modules": ["m1", "m2", "m3", "m4", "m5", "cap"]},
    {"id": "image", "title": "Image generation", "modules": ["v1", "g1"], "extra": ["cap-2"]},
    {"id": "audio", "title": "Speech & audio", "modules": ["a1"]},
    {"id": "video", "title": "Video models", "modules": ["vd"]},
    {"id": "multimodal", "title": "Multimodal models", "modules": ["v1", "mm"]},
    {"id": "rl", "title": "RL & reasoning", "modules": ["rl", "rs"]},
    {"id": "apps", "title": "Build apps with LLMs", "modules": ["sy"], "extra": ["cap-3"]},
    {"id": "agents", "title": "Build agents: MCP, skills & more", "modules": ["ag"], "extra": ["sy-5", "cap-3"]},
    {"id": "eval", "title": "Evaluate models properly", "modules": ["m4"]},
    {"id": "efficient", "title": "Fast & efficient models", "modules": ["m5", "ar"]},
    {"id": "history", "title": "The big picture first", "modules": ["h1"]}
  ],
  modules: {
    m0: { code: "M0", title: "How to learn this course", cover: "cover-m0.webp", tags: [], lessons: [
      { id: "m0-1", title: "How memory works", mins: 8, pre: [], ready: true },
      { id: "m0-2", title: "The learning loop", mins: 6, pre: [], ready: true },
      { id: "m0-3", title: "Your review routine", mins: 5, pre: [], ready: true }
    ]},
    h1: { code: "H1", title: "The story of AI", cover: "cover-h1.webp", tags: ["history of ai", "perceptron", "alexnet", "imagenet", "word2vec", "transformer"], lessons: [
      { id: "h1-1", title: "From perceptrons to backprop (1943–1986)", mins: 8, pre: [], ready: true, colab: "h1-1-perceptron.ipynb" },
      { id: "h1-2", title: "The deep-learning breakthrough (2006–2014)", mins: 8, pre: ["h1-1"], ready: true },
      { id: "h1-3", title: "Attention and the Transformer (2014–2017)", mins: 8, pre: ["h1-2"], ready: true },
      { id: "h1-4", title: "The scaling era (2018–2022)", mins: 8, pre: ["h1-3"], ready: true },
      { id: "h1-5", title: "Today's landscape (2023–2026)", mins: 10, pre: ["h1-4"], ready: true },
      { id: "h1-6", title: "The AI family tree", mins: 8, pre: ["h1-5"], ready: true }
    ]},
    p1: { code: "P1", title: "Math you actually need", cover: "cover-p1.webp", tags: [], lessons: [
      { id: "p1-1", title: "Vectors & dot products", mins: 10, pre: [], ready: true, colab: "p1-1-vectors.ipynb" },
      { id: "p1-2", title: "Matrices as transformations", mins: 10, pre: ["p1-1"], ready: true },
      { id: "p1-3", title: "Derivatives & the chain rule", mins: 12, pre: [], ready: true },
      { id: "p1-4", title: "Gradients", mins: 8, pre: ["p1-1", "p1-3"], ready: true },
      { id: "p1-5", title: "Probability & expectation", mins: 10, pre: [], ready: true },
      { id: "p1-6", title: "Entropy, cross-entropy & KL", mins: 12, pre: ["p1-5"], ready: true, colab: "p1-6-entropy-kl.ipynb" }
    ]},
    p2: { code: "P2", title: "Machine-learning basics", cover: "cover-p2.webp", tags: [], lessons: [
      { id: "p2-1", title: "Loss functions", mins: 8, pre: ["p1-5", "p1-6"], ready: true },
      { id: "p2-2", title: "Gradient descent", mins: 12, pre: ["p1-3", "p2-1"], ready: true, colab: "p2-2-gradient-descent.ipynb" },
      { id: "p2-3", title: "Backpropagation", mins: 12, pre: ["p1-3", "p1-4", "p2-2"], ready: true, colab: "p2-3-backprop.ipynb" },
      { id: "p2-4", title: "Overfitting & data splits", mins: 8, pre: ["p2-1", "p2-2"], ready: true }
    ]},
    p3: { code: "P3", title: "Neural nets → language", cover: "cover-p3.webp", tags: ["tokenizer", "tokenization", "embedding"], lessons: [
      { id: "p3-1", title: "MLPs", mins: 8, pre: ["p1-1", "p1-2", "p2-3"], ready: true },
      { id: "p3-2", title: "Softmax", mins: 6, pre: ["p3-1", "p1-5", "p1-6"], ready: true },
      { id: "p3-3", title: "Tokenization (BPE)", mins: 10, pre: ["p3-2"], ready: true, colab: "p3-3-bpe-tokenizer.ipynb" },
      { id: "p3-4", title: "Embeddings", mins: 8, pre: ["p1-1", "p1-2", "p3-2", "p3-3"], ready: true, colab: "p3-4-embeddings.ipynb" }
    ]},
    p4: { code: "P4", title: "PyTorch in an hour", cover: "cover-p4.webp", tags: ["pytorch"], lessons: [
      { id: "p4-1", title: "Tensors & autograd", mins: 12, pre: ["p1-2", "p2-3"], ready: true, colab: "p4-1-tensors-autograd.ipynb" },
      { id: "p4-2", title: "A training loop", mins: 12, pre: ["p4-1", "p2-2", "p2-4"], ready: true, colab: "p4-2-training-loop.ipynb" }
    ]},
    p5: { code: "P5", title: "Math for generative models", cover: "cover-p5.webp", tags: [], lessons: [
      { id: "p5-1", title: "Gaussians & noise", mins: 8, pre: ["p1-5"], ready: true, colab: "p5-1-gaussians-noise.ipynb" },
      { id: "p5-2", title: "Bayes' rule & latent variables", mins: 10, pre: ["p1-5"], ready: true },
      { id: "p5-3", title: "Markov chains & sampling", mins: 8, pre: ["p1-5"], ready: true },
      { id: "p5-4", title: "Convolution", mins: 8, pre: ["p1-2"], ready: true, colab: "p5-4-convolution.ipynb" },
      { id: "p5-5", title: "Frequencies & spectrograms", mins: 10, pre: ["p5-4"], ready: true }
    ]},
    p6: { code: "P6", title: "Classic deep-learning architectures", cover: "cover-p6.webp", tags: ["convolutional", "resnet", "lstm", "recurrent", "autoencoder"], lessons: [
      { id: "p6-1", title: "CNNs: filters, pooling & receptive fields", mins: 10, pre: ["p3-1", "p5-4"], ready: true, colab: "p6-1-cnn.ipynb" },
      { id: "p6-2", title: "ResNets & normalization", mins: 8, pre: ["p6-1"], ready: true },
      { id: "p6-3", title: "RNNs & LSTMs (and why Transformers won)", mins: 10, pre: ["p3-1"], ready: true, colab: "p6-3-rnn.ipynb" },
      { id: "p6-4", title: "Autoencoders & representation learning", mins: 8, pre: ["p3-1"], ready: true }
    ]},
    m1: { code: "M1", title: "Transformers", cover: "cover-m1.webp", tags: ["attention", "transformer", "positional encoding", "rope", "kv cache", "sampling"], lessons: [
      { id: "m1-1", title: "Attention", mins: 15, pre: ["p1-1", "p3-2", "p3-4"], ready: true, colab: "m1-1-attention.ipynb" },
      { id: "m1-2", title: "Multi-head attention", mins: 10, pre: ["m1-1"], ready: true, colab: "m1-2-multihead.ipynb" },
      { id: "m1-3", title: "Positional encodings", mins: 10, pre: ["m1-1"], ready: true },
      { id: "m1-4", title: "The decoder-only transformer", mins: 12, pre: ["m1-2", "m1-3", "p3-1"], ready: true },
      { id: "m1-5", title: "KV cache & sampling", mins: 12, pre: ["m1-4"], ready: true, colab: "m1-5-kv-cache-sampling.ipynb" }
    ]},
    m2: { code: "M2", title: "Pretraining", cover: "cover-m2.webp", tags: ["pretraining", "pre-training", "scaling law", "optimizer", "data mixture", "distributed training"], lessons: [
      { id: "m2-1", title: "Pretraining data", mins: 10, pre: ["p3-3"], ready: true },
      { id: "m2-2", title: "The next-token objective", mins: 8, pre: ["m1-4", "p1-6"], ready: true },
      { id: "m2-3", title: "Optimizers & LR schedules", mins: 12, pre: ["p2-2"], ready: true, colab: "m2-3-optimizers-schedules.ipynb" },
      { id: "m2-4", title: "Scaling laws", mins: 10, pre: ["m2-2"], ready: true, colab: "m2-4-scaling-laws.ipynb" },
      { id: "m2-5", title: "Distributed training & mixed precision", mins: 15, pre: ["m2-3"], ready: true }
    ]},
    m3: { code: "M3", title: "Post-training", cover: "cover-m3.webp", tags: ["rlhf", "dpo", "preference optimization", "reward model", "instruction tuning", "fine-tuning", "lora", "grpo"], lessons: [
      { id: "m3-1", title: "SFT & instruction tuning", mins: 10, pre: ["m2-2"], ready: true },
      { id: "m3-2", title: "Reward models", mins: 10, pre: ["m3-1"], ready: true, colab: "m3-2-reward-model.ipynb" },
      { id: "m3-3", title: "RLHF with PPO", mins: 15, pre: ["m3-2", "p1-6"], ready: true },
      { id: "m3-4", title: "DPO", mins: 12, pre: ["m3-2"], ready: true, colab: "m3-4-dpo.ipynb" },
      { id: "m3-5", title: "GRPO & verifiable rewards", mins: 12, pre: ["m3-3"], ready: true, colab: "m3-5-grpo-advantages.ipynb" },
      { id: "m3-6", title: "Constitutional AI & RLAIF", mins: 10, pre: ["m3-3"], ready: true },
      { id: "m3-7", title: "LoRA & QLoRA", mins: 12, pre: ["m3-1", "p1-2"], ready: true, colab: "m3-7-lora.ipynb" }
    ]},
    m4: { code: "M4", title: "Evaluation", cover: "cover-m4.webp", tags: ["benchmark", "evaluation", "llm-as-a-judge", "contamination", "leaderboard"], lessons: [
      { id: "m4-1", title: "Perplexity", mins: 8, pre: ["m2-2"], ready: true, colab: "m4-1-perplexity.ipynb" },
      { id: "m4-2", title: "Benchmarks", mins: 10, pre: [], ready: true, colab: "m4-2-pass-at-k.ipynb" },
      { id: "m4-3", title: "Contamination", mins: 8, pre: ["m4-2", "m2-1"], ready: true },
      { id: "m4-4", title: "LLM-as-judge", mins: 10, pre: ["m4-2"], ready: true, colab: "m4-4-llm-judge.ipynb" },
      { id: "m4-5", title: "Human eval, pairwise & Elo", mins: 10, pre: ["m3-2"], ready: true, colab: "m4-5-elo-bradley-terry.ipynb" },
      { id: "m4-6", title: "Statistical rigor", mins: 14, pre: ["m4-2"], ready: true, colab: "m4-6-error-bars.ipynb" },
      { id: "m4-7", title: "Building your own evals", mins: 12, pre: ["m4-6"], ready: true, colab: "m4-7-eval-harness.ipynb" },
      { id: "m4-8", title: "Safety & agent evals", mins: 12, pre: ["m4-7"], ready: true }
    ]},
    m5: { code: "M5", title: "Optimization", cover: "cover-m5.webp", tags: ["quantization", "distillation", "pruning", "speculative decoding", "inference", "serving", "flashattention"], lessons: [
      { id: "m5-1", title: "Quantization", mins: 14, pre: ["m2-5", "m1-5", "m4-1"], ready: true, colab: "m5-1-quantization.ipynb" },
      { id: "m5-2", title: "Distillation & pruning", mins: 10, pre: ["p1-6", "p3-2", "m3-1", "m5-1"], ready: true },
      { id: "m5-3", title: "Mixture of experts", mins: 10, pre: ["m1-4", "p3-2", "m2-5"], ready: true, colab: "m5-3-moe-router.ipynb" },
      { id: "m5-4", title: "FlashAttention & paged attention", mins: 12, pre: ["m1-1", "m1-5"], ready: true, colab: "m5-4-online-softmax.ipynb" },
      { id: "m5-5", title: "Speculative decoding", mins: 10, pre: ["m1-5", "m5-4"], ready: true, colab: "m5-5-speculative-decoding.ipynb" },
      { id: "m5-6", title: "Batching & serving metrics", mins: 10, pre: ["m1-5", "m5-4", "m5-5"], ready: true }
    ]},
    ar: { code: "AR", title: "Beyond the dense transformer", cover: "cover-ar.webp", tags: ["mixture of experts", "moe", "state space model", "mamba", "linear attention", "long context", "hybrid architecture", "diffusion language model", "next-concept modeling", "parallel decoding"], lessons: [
      { id: "ar-1", title: "MoE deep dive: routing & expert design", mins: 12, pre: ["m5-3"], ready: true, colab: "ar-1-moe-routing.ipynb" },
      { id: "ar-2", title: "Training & serving MoE at scale", mins: 10, pre: ["ar-1", "m2-5"], ready: true },
      { id: "ar-3", title: "State-space models & Mamba", mins: 12, pre: ["p6-3", "m1-4"], ready: true, colab: "ar-3-ssm-scan.ipynb" },
      { id: "ar-4", title: "Hybrid & linear-attention models", mins: 10, pre: ["ar-3"], ready: true },
      { id: "ar-5", title: "Long context", mins: 12, pre: ["m1-3", "m5-4"], ready: true },
      { id: "ar-6", title: "Diffusion language models", mins: 12, pre: ["m2-2", "m1-5"], ready: true },
      { id: "ar-7", title: "Next-concept modeling (NCM)", mins: 12, pre: ["ar-6", "p6-4"], ready: true, colab: "ar-7-coarse-to-fine.ipynb" }
    ]},
    cap: { code: "★", title: "Capstone: build an LLM pipeline", cover: "cover-cap.webp", tags: [], lessons: [
      { id: "cap-1", title: "Fine-tune → evaluate → optimize", mins: 30, pre: ["m3-7", "m4-6", "m5-1"], ready: true, colab: "cap-1-capstone-starter.ipynb" }
    ]},
    v1: { code: "V1", title: "Vision", cover: "cover-v1.webp", tags: ["vision transformer", "vit", "clip", "contrastive", "self-supervised", "segmentation", "image recognition"], lessons: [
      { id: "v1-1", title: "Vision Transformers: images as patches", mins: 10, pre: ["m1-4", "p6-1"], ready: true, colab: "v1-1-vit-patches.ipynb" },
      { id: "v1-2", title: "Contrastive learning & CLIP", mins: 10, pre: ["v1-1", "p3-4"], ready: true, colab: "v1-2-clip-loss.ipynb" },
      { id: "v1-3", title: "Self-supervised vision (MAE, DINO)", mins: 10, pre: ["v1-1"], ready: true },
      { id: "v1-4", title: "Detection & segmentation (SAM)", mins: 8, pre: ["v1-3"], ready: true }
    ]},
    g1: { code: "G1", title: "Image generation", cover: "cover-g1.webp", tags: ["diffusion", "image generation", "text-to-image", "gan", "vae", "flow matching", "rectified flow", "guidance"], lessons: [
      { id: "g1-1", title: "Variational autoencoders", mins: 10, pre: ["p6-4", "p5-2"], ready: true },
      { id: "g1-2", title: "GANs", mins: 10, pre: ["p6-1"], ready: true },
      { id: "g1-3", title: "Diffusion from scratch", mins: 14, pre: ["p5-1", "p5-3", "p6-1"], ready: true, colab: "g1-3-diffusion-2d.ipynb" },
      { id: "g1-4", title: "Latent diffusion & guidance", mins: 12, pre: ["g1-3", "g1-1", "v1-2"], ready: true },
      { id: "g1-5", title: "Flow matching & rectified flow", mins: 12, pre: ["g1-3"], ready: true, colab: "g1-5-flow-matching.ipynb" },
      { id: "g1-6", title: "Diffusion transformers & autoregressive images", mins: 10, pre: ["g1-4", "v1-1"], ready: true },
      { id: "g1-7", title: "Controlling & editing images", mins: 10, pre: ["g1-4", "m3-7"], ready: true }
    ]},
    a1: { code: "A1", title: "Audio & speech", cover: "cover-a1.webp", tags: ["speech", "audio", "text-to-speech", "asr", "speech recognition", "audio codec", "music generation", "voice"], lessons: [
      { id: "a1-1", title: "Sound as data", mins: 8, pre: ["p5-5"], ready: true, colab: "a1-1-sound-as-data.ipynb" },
      { id: "a1-2", title: "Speech recognition: CTC to Whisper", mins: 12, pre: ["a1-1", "m1-4"], ready: true, colab: "a1-2-ctc.ipynb" },
      { id: "a1-3", title: "Neural audio codecs & audio tokens", mins: 10, pre: ["a1-1", "p6-4"], ready: true },
      { id: "a1-4", title: "Text-to-speech & voice", mins: 10, pre: ["a1-3", "m1-5"], ready: true },
      { id: "a1-5", title: "Music & sound generation", mins: 10, pre: ["a1-3", "g1-3"], ready: true },
      { id: "a1-6", title: "Real-time speech-to-speech models", mins: 10, pre: ["a1-2", "a1-4"], ready: true }
    ]},
    mm: { code: "MM", title: "Multimodal models", cover: "cover-mm.webp", tags: ["multimodal", "vision-language", "vlm", "any-to-any", "document understanding", "gui agent"], lessons: [
      { id: "mm-1", title: "Connecting vision to LLMs", mins: 12, pre: ["v1-2", "m1-4"], ready: true, colab: "mm-1-projector.ipynb" },
      { id: "mm-2", title: "Native multimodal & any-to-any models", mins: 10, pre: ["mm-1", "a1-3"], ready: true },
      { id: "mm-3", title: "Documents, charts & screens", mins: 10, pre: ["mm-1"], ready: true },
      { id: "mm-4", title: "Multimodal evaluation & hallucination", mins: 10, pre: ["mm-1", "m4-4"], ready: true }
    ]},
    vd: { code: "VD", title: "Video", cover: "cover-vd.webp", tags: ["video generation", "text-to-video", "world model", "video understanding"], lessons: [
      { id: "vd-1", title: "Video as space-time patches", mins: 8, pre: ["v1-1"], ready: true, colab: "vd-1-spacetime-patches.ipynb" },
      { id: "vd-2", title: "Video diffusion transformers", mins: 12, pre: ["vd-1", "g1-6"], ready: true },
      { id: "vd-3", title: "Consistency, length & world models", mins: 10, pre: ["vd-2"], ready: true },
      { id: "vd-4", title: "Video understanding", mins: 8, pre: ["vd-1", "mm-1"], ready: true }
    ]},
    rl: { code: "RL", title: "Reinforcement learning from scratch", cover: "cover-rl.webp", tags: ["reinforcement learning", "policy gradient", "q-learning", "actor-critic", "self-play", "alphazero"], lessons: [
      { id: "rl-1", title: "Agents, environments & rewards", mins: 8, pre: ["p1-5"], ready: true },
      { id: "rl-2", title: "Value functions & the Bellman equation", mins: 10, pre: ["rl-1"], ready: true },
      { id: "rl-3", title: "Q-learning & DQN", mins: 10, pre: ["rl-2", "p3-1"], ready: true, colab: "rl-3-q-learning.ipynb" },
      { id: "rl-4", title: "Policy gradients & REINFORCE", mins: 12, pre: ["rl-1", "p2-2"], ready: true, colab: "rl-4-reinforce.ipynb" },
      { id: "rl-5", title: "Actor-critic & PPO", mins: 12, pre: ["rl-4", "rl-2"], ready: true },
      { id: "rl-6", title: "Self-play & search: AlphaGo to MuZero", mins: 10, pre: ["rl-3", "rl-5"], ready: true }
    ]},
    rs: { code: "RS", title: "Reasoning & test-time compute", cover: "cover-rs.webp", tags: ["reasoning", "chain-of-thought", "test-time compute", "inference-time scaling", "verifier", "process reward"], lessons: [
      { id: "rs-1", title: "Chain of thought", mins: 8, pre: ["m3-1"], ready: true },
      { id: "rs-2", title: "Test-time compute: sampling, voting & search", mins: 10, pre: ["rs-1", "m1-5"], ready: true, colab: "rs-2-self-consistency.ipynb" },
      { id: "rs-3", title: "Training reasoning models", mins: 12, pre: ["rs-2", "m3-5", "rl-5"], ready: true },
      { id: "rs-4", title: "Process vs outcome rewards & verifiers", mins: 10, pre: ["rs-3"], ready: true }
    ]},
    sy: { code: "SY", title: "Building with LLMs", cover: "cover-sy.webp", tags: ["retrieval-augmented", "rag", "agent", "tool use", "function calling", "prompt engineering", "vector search", "guardrail"], lessons: [
      { id: "sy-1", title: "Prompting that works", mins: 8, pre: ["m3-1"], ready: true },
      { id: "sy-2", title: "Embeddings & vector search", mins: 10, pre: ["p3-4"], ready: true, colab: "sy-2-vector-search.ipynb" },
      { id: "sy-3", title: "Retrieval-augmented generation", mins: 12, pre: ["sy-2", "sy-1"], ready: true, colab: "sy-3-rag-eval.ipynb" },
      { id: "sy-4", title: "Tool use & function calling", mins: 10, pre: ["sy-1"], ready: true },
      { id: "sy-5", title: "Agents: loops, memory & planning", mins: 12, pre: ["sy-4", "sy-3"], ready: true, colab: "sy-5-agent-loop.ipynb" },
      { id: "sy-6", title: "Prompt, RAG or fine-tune?", mins: 8, pre: ["sy-3", "m3-7"], ready: true },
      { id: "sy-7", title: "Guardrails & safety in products", mins: 10, pre: ["sy-5", "m4-8"], ready: true }
    ]},
    ag: { code: "AG", title: "The agent toolkit: MCP, skills & more", cover: "cover-ag.webp", tags: ["model context protocol", "mcp", "agent skills", "agents.md", "context engineering", "multi-agent", "agent2agent", "a2a", "llm wiki", "computer use", "coding agent", "subagent"], lessons: [
      { id: "ag-1", title: "Where to use what: the agent toolkit on one page", mins: 8, pre: [], ready: true },
      { id: "ag-2", title: "Context engineering: what the model sees", mins: 8, pre: ["ag-1", "sy-1"], ready: true },
      { id: "ag-3", title: "MCP: one plug for every tool", mins: 10, pre: ["ag-1", "sy-4"], ready: true, colab: "ag-3-mcp-from-scratch.ipynb" },
      { id: "ag-4", title: "Agent Skills: expertise loaded on demand", mins: 8, pre: ["ag-2"], ready: true },
      { id: "ag-5", title: "AGENTS.md & project memory files", mins: 8, pre: ["ag-2"], ready: true },
      { id: "ag-6", title: "The LLM wiki: knowledge that compounds", mins: 8, pre: ["ag-5", "sy-3"], ready: true },
      { id: "ag-7", title: "Subagents, multi-agent systems & A2A", mins: 10, pre: ["ag-3", "sy-5"], ready: true },
      { id: "ag-8", title: "Starter kit: a server, a skill and a rules file", mins: 12, pre: ["ag-3", "ag-4", "ag-5"], ready: true, colab: "ag-8-starter-kit.ipynb" }
    ]},
    in: { code: "IN", title: "Interpretability", cover: "cover-in.webp", tags: ["interpretability", "sparse autoencoder", "circuits", "probing", "superposition"], lessons: [
      { id: "in-1", title: "Features & superposition", mins: 10, pre: ["m1-4", "p1-1"], ready: true },
      { id: "in-2", title: "Probing & circuits", mins: 10, pre: ["in-1"], ready: true },
      { id: "in-3", title: "Sparse autoencoders", mins: 10, pre: ["in-2", "p6-4"], ready: true, colab: "in-3-sparse-autoencoder.ipynb" }
    ]},
    cx: { code: "★", title: "More capstones", cover: "cover-cx.webp", tags: [], lessons: [
      { id: "cap-2", title: "Build a tiny diffusion model", mins: 30, pre: ["g1-3", "p4-2"], ready: true, colab: "cap-2-tiny-diffusion.ipynb" },
      { id: "cap-3", title: "Build a RAG agent with evals", mins: 30, pre: ["sy-5", "m4-7"], ready: true, colab: "cap-3-rag-agent.ipynb" }
    ]}
  }
};

/* Flat, ordered list of every lesson with its module attached. */
LC.allLessons = function () {
  var out = [];
  LC.course.tracks.forEach(function (t) {
    t.modules.forEach(function (mid) {
      var m = LC.course.modules[mid];
      m.lessons.forEach(function (l) { out.push(Object.assign({ module: mid, moduleTitle: m.title, moduleCode: m.code }, l)); });
    });
  });
  return out;
};

/* Lessons a goal aims at: all lessons of its modules plus any extras. */
LC.goalTargets = function (g) {
  var ids = (g.extra || []).slice();
  (g.modules || []).forEach(function (mid) { LC.course.modules[mid].lessons.forEach(function (l) { ids.push(l.id); }); });
  return ids;
};

/* Every lesson needed to reach `targets`, prerequisites included, in course order. */
LC.pathTo = function (targets) {
  var all = LC.allLessons(), byId = {}, need = {};
  all.forEach(function (l) { byId[l.id] = l; });
  (function add(ids) {
    ids.forEach(function (id) { if (!need[id] && byId[id]) { need[id] = true; add(byId[id].pre || []); } });
  })(targets);
  return all.filter(function (l) { return need[l.id]; });
};
