import type { RawTopic, Domain } from '../types';

const now = Date.now();
const hr = 3600_000;
const day = 86400_000;

function t(id: string, title: string, source: RawTopic['source'], domain: Domain, tags: string[], significance: number, novelty: number, ageHr: number): RawTopic {
  return {
    id,
    title,
    source,
    domain,
    tags,
    significance,
    novelty,
    publishedAt: now - ageHr * hr,
  };
}

export const TOPIC_POOL: RawTopic[] = [
  // AI Security
  t('sec-prompt-injection-defense', 'New Defense Framework Cuts Prompt Injection Success by 73%', { name: 'arXiv', url: 'https://arxiv.org/abs/2402.11' }, 'AI Security', ['Model Safety', 'LLMs', 'AI Agents'], 88, 82, 5),
  t('sec-model-extraction', 'Researchers Demonstrate Model Extraction Attack on Production APIs', { name: 'arXiv', url: 'https://arxiv.org/abs/2403.02' }, 'AI Security', ['Model Safety', 'Enterprise AI'], 71, 64, 28),
  t('sec-adversarial-patches', 'Physical Adversarial Patches Still Evade Vision Models in 2025', { name: 'Papers With Code', url: 'https://paperswithcode.com/paper/adversarial-patches' }, 'AI Security', ['Computer Vision', 'Model Safety'], 54, 22, 40),
  t('sec-data-poisoning', 'Study Finds Open Datasets Contain 3% Poisoned Samples', { name: 'MIT Tech Review', url: 'https://technologyreview.com/data-poisoning' }, 'AI Security', ['Model Safety', 'Open Source AI'], 76, 70, 12),

  // Machine Learning
  t('ml-mixture-experts-scale', 'Sparse Mixture-of-Experts Hits 1T Parameters at Inference Cost of 12B', { name: 'arXiv', url: 'https://arxiv.org/abs/2402.88' }, 'Machine Learning', ['LLMs', 'AI Hardware'], 90, 86, 8),
  t('ml-rlhf-alignment', 'Improved RLHF Reduces Hallucination Rates by 40% Without Capability Loss', { name: 'Anthropic', url: 'https://anthropic.com/rlhf-2025' }, 'Machine Learning', ['LLMs', 'Reinforcement Learning'], 84, 78, 20),
  t('ml-quantization-1bit', '1-Bit Quantization Preserves 98% Performance on Consumer GPUs', { name: 'Hugging Face', url: 'https://huggingface.co/blog/1bit-quant' }, 'Machine Learning', ['LLMs', 'Edge AI', 'AI Hardware'], 79, 88, 15),
  t('ml-old-optimizer', 'Revisiting AdamW Optimizer for Long-Context Training', { name: 'arXiv', url: 'https://arxiv.org/abs/2309.04' }, 'Machine Learning', ['Reinforcement Learning'], 38, 12, 96),

  // Robotics
  t('robo-vla-model', 'Vision-Language-Action Model Enables Zero-Shot Robot Manipulation', { name: 'DeepMind', url: 'https://deepmind.google/vla-model' }, 'Robotics', ['Robot Learning', 'Multimodal Models', 'AI Agents'], 92, 90, 6),
  t('robo-sim-to-real', 'Sim-to-Real Transfer Closes Gap for Quadruped Locomotion', { name: 'Papers With Code', url: 'https://paperswithcode.com/paper/sim2real-2025' }, 'Robotics', ['Robot Learning', 'Reinforcement Learning'], 72, 68, 33),
  t('robo-humanoid-parkour', 'Humanoid Robot Completes Autonomous Parkour Course', { name: 'MIT Tech Review', url: 'https://technologyreview.com/humanoid-parkour' }, 'Robotics', ['Robot Learning', 'AI Hardware'], 81, 84, 18),

  // AI Products
  t('prod-agent-framework', 'Open-Source Agent Framework Adds Native Long-Running Task Orchestration', { name: 'Hugging Face', url: 'https://huggingface.co/blog/agent-framework' }, 'AI Products', ['AI Agents', 'Open Source AI', 'AI Coding Tools'], 86, 80, 10),
  t('prod-copilot-context', 'IDE Copilot Gains 1M-Token Project-Wide Context Window', { name: 'OpenAI', url: 'https://openai.com/blog/copilot-context' }, 'AI Products', ['AI Coding Tools', 'LLMs'], 83, 85, 14),
  t('prod-enterprise-rag', 'Enterprise RAG Benchmark Released: 40% of Systems Fail Accuracy Bar', { name: 'AI Index Report', url: 'https://aiindex.stanford.edu/rag-bench' }, 'AI Products', ['Enterprise AI', 'LLMs'], 77, 74, 22),
  t('prod-ai-meme-bot', 'Viral AI Meme Generator Hits 10M Users in a Week', { name: 'MIT Tech Review', url: 'https://technologyreview.com/meme-bot' }, 'AI Products', ['Generative AI'], 22, 60, 3),
  t('prod-celebrity-ai-voice', 'Celebrity Sues Over Unauthorized AI Voice Clone App', { name: 'MIT Tech Review', url: 'https://technologyreview.com/voice-clone' }, 'AI Products', ['Generative AI'], 18, 45, 4),

  // AI Research
  t('res-scaling-laws-2025', 'Updated Scaling Laws Suggest Compute-Optimal Frontier at 10x Current Size', { name: 'arXiv', url: 'https://arxiv.org/abs/2403.77' }, 'AI Research', ['LLMs', 'AI Hardware'], 93, 91, 9),
  t('res-reasoning-o1', 'Self-Play Reasoning Models Break Through on Competition Mathematics', { name: 'OpenAI', url: 'https://openai.com/blog/reasoning' }, 'AI Research', ['LLMs', 'Reinforcement Learning'], 91, 89, 11),
  t('res-world-models', 'Generative World Models Reach 30-Second Coherent Video Rollouts', { name: 'DeepMind', url: 'https://deepmind.google/world-models' }, 'AI Research', ['Generative AI', 'Multimodal Models'], 85, 87, 16),
  t('res-old-transformer', 'Attention Is All You Need: A Retrospective Survey', { name: 'arXiv', url: 'https://arxiv.org/abs/1706.03' }, 'AI Research', ['LLMs'], 30, 5, 200),

  // AI Ethics & Policy
  t('policy-eu-ai-act', 'EU AI Act Enforcement Begins: First Compliance Deadlines Hit', { name: 'AI Index Report', url: 'https://aiindex.stanford.edu/eu-ai-act' }, 'AI Ethics & Policy', ['AI Regulation', 'Enterprise AI'], 89, 83, 7),
  t('policy-watermark-standard', 'NIST Publishes AI Content Watermarking Standard Draft', { name: 'MIT Tech Review', url: 'https://technologyreview.com/watermark-standard' }, 'AI Ethics & Policy', ['AI Regulation', 'Model Safety'], 74, 79, 19),
  t('policy-copyright-lawsuit', 'Major Publisher Settles AI Training Copyright Lawsuit', { name: 'MIT Tech Review', url: 'https://technologyreview.com/copyright-settlement' }, 'AI Ethics & Policy', ['AI Regulation', 'Open Source AI'], 68, 72, 24),
  t('policy-ai-meme-regulation', 'Senator Proposes Ban on AI-Generated Political Memes', { name: 'MIT Tech Review', url: 'https://technologyreview.com/meme-ban' }, 'AI Ethics & Policy', ['AI Regulation'], 35, 50, 2),

  // New real 2025-2026 topics
  t('sec-agent-firewall', 'Open-Source Agent Firewall Blocks 96% of Tool-Use Attacks in Benchmarks', { name: 'arXiv', url: 'https://arxiv.org/abs/2502.19' }, 'AI Security', ['Model Safety', 'AI Agents'], 87, 84, 4),
  t('sec-deepfake-watermark', 'C2PA Content Provenance Standard Adopted by Major Platforms', { name: 'MIT Tech Review', url: 'https://technologyreview.com/c2pa-adoption' }, 'AI Security', ['Model Safety', 'AI Regulation'], 75, 66, 9),
  t('sec-jailbreak-rlhf', 'Adversarial Training Cuts Jailbreak Success Rate to Under 2%', { name: 'Anthropic', url: 'https://anthropic.com/jailbreak-defense' }, 'AI Security', ['Model Safety', 'LLMs'], 82, 76, 14),

  t('ml-deepseek-v3', 'DeepSeek-V3 Achieves GPT-4-Level Performance at 1/10th Training Cost', { name: 'arXiv', url: 'https://arxiv.org/abs/2501.12' }, 'Machine Learning', ['LLMs', 'Open Source AI'], 94, 92, 3),
  t('ml-mamba-ssm', 'State-Space Models Match Transformer Quality at 4x Inference Throughput', { name: 'Papers With Code', url: 'https://paperswithcode.com/paper/mamba-scaling' }, 'Machine Learning', ['LLMs', 'AI Hardware'], 85, 88, 11),
  t('ml-test-time-compute', 'Test-Time Compute Scaling Law Confirmed: Models Get Smarter With More Inference Budget', { name: 'OpenAI', url: 'https://openai.com/blog/test-time-compute' }, 'Machine Learning', ['LLMs', 'Reinforcement Learning'], 89, 85, 7),

  t('robo-figure-02', 'Figure 02 Humanoid Demonstrates Autonomous Warehouse Tasks Without Teleoperation', { name: 'MIT Tech Review', url: 'https://technologyreview.com/figure-02' }, 'Robotics', ['Robot Learning', 'AI Agents'], 86, 89, 5),
  t('robo-rt2-deployment', 'RT-2 Vision-Language-Action Model Deployed in Manufacturing Assembly Lines', { name: 'DeepMind', url: 'https://deepmind.google/rt2-deploy' }, 'Robotics', ['Robot Learning', 'Multimodal Models'], 73, 65, 26),

  t('prod-claude-computer-use', 'Claude Gains Computer Use Capability — Can Navigate Desktop Apps Autonomously', { name: 'Anthropic', url: 'https://anthropic.com/computer-use' }, 'AI Products', ['AI Agents', 'AI Coding Tools'], 90, 91, 6),
  t('prod-cursor-500m', 'Cursor AI IDE Reaches $500M ARR, Fastest-Growing SaaS in History', { name: 'MIT Tech Review', url: 'https://technologyreview.com/cursor-arr' }, 'AI Products', ['AI Coding Tools', 'AI Startups'], 78, 82, 8),
  t('prod-v0-bolt', 'AI App Generators Like v0 and Bolt Reach 50M Users Combined', { name: 'Hugging Face', url: 'https://huggingface.co/blog/ai-app-gen' }, 'AI Products', ['Generative AI', 'AI Startups'], 72, 79, 10),
  t('prod-sora-public', 'Sora Video Model Opens to All ChatGPT Plus Users', { name: 'OpenAI', url: 'https://openai.com/blog/sora-public' }, 'AI Products', ['Generative AI', 'Multimodal Models'], 80, 77, 13),

  t('res-o3-reasoning', 'O3 Model Solves 25% of FrontierMath Problems — Previous Best Was 2%', { name: 'OpenAI', url: 'https://openai.com/blog/o3' }, 'AI Research', ['LLMs', 'Reinforcement Learning'], 93, 94, 4),
  t('res-sakana-ai-scientist', 'AI Scientist Agent Autonomously Writes and Reviews Research Papers', { name: 'arXiv', url: 'https://arxiv.org/abs/2504.07' }, 'AI Research', ['AI Agents', 'LLMs'], 84, 90, 12),
  t('res-protein-folding-2026', 'AlphaFold 4 Predicts Protein Complexes With 92% Experimental Accuracy', { name: 'DeepMind', url: 'https://deepmind.google/alphafold-4' }, 'AI Research', ['Generative AI'], 88, 80, 17),

  t('policy-us-exec-order', 'US Executive Order on AI Safety Rescinded, New Framework Proposed', { name: 'AI Index Report', url: 'https://aiindex.stanford.edu/us-ai-policy' }, 'AI Ethics & Policy', ['AI Regulation', 'Enterprise AI'], 82, 78, 6),
  t('policy-china-ai-rules', 'China Mandates AI Model Registration Before Public Release', { name: 'MIT Tech Review', url: 'https://technologyreview.com/china-registration' }, 'AI Ethics & Policy', ['AI Regulation'], 76, 71, 15),
  t('policy-open-weights-debate', 'EU Considers Exempting Open-Weight Models From AI Act Requirements', { name: 'MIT Tech Review', url: 'https://technologyreview.com/open-weights-eu' }, 'AI Ethics & Policy', ['AI Regulation', 'Open Source AI'], 70, 73, 20),
];
