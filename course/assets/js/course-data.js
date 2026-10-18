/* The whole syllabus. Lessons with `ready: true` have a page in /lessons/<id>.html.
   Anything else renders as "coming soon" on the course map. */
window.LC = window.LC || {};

LC.config = {
  // Colab "Open in Colab" links point at notebooks in this GitHub repo + branch.
  repo: "abhishekaryan23/LLM-Learner",
  branch: "main",
  notebookDir: "course/notebooks"
};

LC.course = {
  title: "LLMs, Animated",
  tracks: [
    { id: "start", title: "Start here", modules: ["m0"] },
    { id: "prereq", title: "Prerequisites", note: "Already solid on a topic? Try its quiz first. If you ace it, move on.", modules: ["p1", "p2", "p3", "p4"] },
    { id: "core", title: "Core", modules: ["m1", "m2", "m3", "m4", "m5", "cap"] }
  ],
  modules: {
    m0: { code: "M0", title: "How to learn this course", cover: "cover-m0.webp", lessons: [
      { id: "m0-1", title: "How memory works", mins: 8, ready: true },
      { id: "m0-2", title: "The learning loop", mins: 6, ready: true },
      { id: "m0-3", title: "Your review routine", mins: 5, ready: true }
    ]},
    p1: { code: "P1", title: "Math you actually need", cover: "cover-p1.webp", lessons: [
      { id: "p1-1", title: "Vectors & dot products", mins: 10, ready: true, colab: "p1-1-vectors.ipynb" },
      { id: "p1-2", title: "Matrices as transformations", mins: 10, ready: true },
      { id: "p1-3", title: "Derivatives & the chain rule", mins: 12, ready: true },
      { id: "p1-4", title: "Gradients", mins: 8, ready: true },
      { id: "p1-5", title: "Probability & expectation", mins: 10, ready: true },
      { id: "p1-6", title: "Entropy, cross-entropy & KL", mins: 12, ready: true, colab: "p1-6-entropy-kl.ipynb" }
    ]},
    p2: { code: "P2", title: "Machine-learning basics", cover: "cover-p2.webp", lessons: [
      { id: "p2-1", title: "Loss functions", mins: 8, ready: true },
      { id: "p2-2", title: "Gradient descent", mins: 12, ready: true, colab: "p2-2-gradient-descent.ipynb" },
      { id: "p2-3", title: "Backpropagation", mins: 12, ready: true, colab: "p2-3-backprop.ipynb" },
      { id: "p2-4", title: "Overfitting & data splits", mins: 8, ready: true }
    ]},
    p3: { code: "P3", title: "Neural nets → language", cover: "cover-p3.webp", lessons: [
      { id: "p3-1", title: "MLPs", mins: 8, ready: true },
      { id: "p3-2", title: "Softmax", mins: 6, ready: true },
      { id: "p3-3", title: "Tokenization (BPE)", mins: 10, ready: true, colab: "p3-3-bpe-tokenizer.ipynb" },
      { id: "p3-4", title: "Embeddings", mins: 8, ready: true, colab: "p3-4-embeddings.ipynb" }
    ]},
    p4: { code: "P4", title: "PyTorch in an hour", cover: "cover-p4.webp", lessons: [
      { id: "p4-1", title: "Tensors & autograd", mins: 12, ready: true, colab: "p4-1-tensors-autograd.ipynb" },
      { id: "p4-2", title: "A training loop", mins: 12, ready: true, colab: "p4-2-training-loop.ipynb" }
    ]},
    m1: { code: "M1", title: "Transformers", cover: "cover-m1.webp", lessons: [
      { id: "m1-1", title: "Attention", mins: 15, ready: true, colab: "m1-1-attention.ipynb" },
      { id: "m1-2", title: "Multi-head attention", mins: 10, ready: true, colab: "m1-2-multihead.ipynb" },
      { id: "m1-3", title: "Positional encodings", mins: 10, ready: true },
      { id: "m1-4", title: "The decoder-only transformer", mins: 12, ready: true },
      { id: "m1-5", title: "KV cache & sampling", mins: 12, ready: true, colab: "m1-5-kv-cache-sampling.ipynb" }
    ]},
    m2: { code: "M2", title: "Pretraining", cover: "cover-m2.webp", lessons: [
      { id: "m2-1", title: "Pretraining data", mins: 10, ready: true },
      { id: "m2-2", title: "The next-token objective", mins: 8, ready: true },
      { id: "m2-3", title: "Optimizers & LR schedules", mins: 12, ready: true, colab: "m2-3-optimizers-schedules.ipynb" },
      { id: "m2-4", title: "Scaling laws", mins: 10, ready: true, colab: "m2-4-scaling-laws.ipynb" },
      { id: "m2-5", title: "Distributed training & mixed precision", mins: 15, ready: true }
    ]},
    m3: { code: "M3", title: "Post-training", cover: "cover-m3.webp", lessons: [
      { id: "m3-1", title: "SFT & instruction tuning", mins: 10, ready: true },
      { id: "m3-2", title: "Reward models", mins: 10, ready: true, colab: "m3-2-reward-model.ipynb" },
      { id: "m3-3", title: "RLHF with PPO", mins: 15, ready: true },
      { id: "m3-4", title: "DPO", mins: 12, ready: true, colab: "m3-4-dpo.ipynb" },
      { id: "m3-5", title: "GRPO & verifiable rewards", mins: 12, ready: true, colab: "m3-5-grpo-advantages.ipynb" },
      { id: "m3-6", title: "Constitutional AI & RLAIF", mins: 10, ready: true },
      { id: "m3-7", title: "LoRA & QLoRA", mins: 12, ready: true, colab: "m3-7-lora.ipynb" }
    ]},
    m4: { code: "M4", title: "Evaluation", cover: "cover-m4.webp", lessons: [
      { id: "m4-1", title: "Perplexity", mins: 8, ready: true, colab: "m4-1-perplexity.ipynb" },
      { id: "m4-2", title: "Benchmarks", mins: 10, ready: true, colab: "m4-2-pass-at-k.ipynb" },
      { id: "m4-3", title: "Contamination", mins: 8, ready: true },
      { id: "m4-4", title: "LLM-as-judge", mins: 10, ready: true, colab: "m4-4-llm-judge.ipynb" },
      { id: "m4-5", title: "Human eval, pairwise & Elo", mins: 10, ready: true, colab: "m4-5-elo-bradley-terry.ipynb" },
      { id: "m4-6", title: "Statistical rigor", mins: 14, ready: true, colab: "m4-6-error-bars.ipynb" },
      { id: "m4-7", title: "Building your own evals", mins: 12, ready: true, colab: "m4-7-eval-harness.ipynb" },
      { id: "m4-8", title: "Safety & agent evals", mins: 12, ready: true }
    ]},
    m5: { code: "M5", title: "Optimization", cover: "cover-m5.webp", lessons: [
      { id: "m5-1", title: "Quantization", mins: 14, ready: true, colab: "m5-1-quantization.ipynb" },
      { id: "m5-2", title: "Distillation & pruning", mins: 10, ready: true },
      { id: "m5-3", title: "Mixture of experts", mins: 10, ready: true, colab: "m5-3-moe-router.ipynb" },
      { id: "m5-4", title: "FlashAttention & paged attention", mins: 12, ready: true, colab: "m5-4-online-softmax.ipynb" },
      { id: "m5-5", title: "Speculative decoding", mins: 10, ready: true, colab: "m5-5-speculative-decoding.ipynb" },
      { id: "m5-6", title: "Batching & serving metrics", mins: 10, ready: true }
    ]},
    cap: { code: "★", title: "Capstone", cover: "cover-cap.webp", lessons: [
      { id: "cap-1", title: "Fine-tune → evaluate → optimize", mins: 30, ready: true, colab: "cap-1-capstone-starter.ipynb" }
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
