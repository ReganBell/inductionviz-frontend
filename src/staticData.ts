/**
 * Static data loader for pre-computed model outputs.
 * Replaces live API calls when the backend is not running.
 */

export type StaticAttentionData = {
  tokens: Array<{ id: number; text: string }>;
  attention: number[][][][]; // [position][layer][head][src_position]
  ov_predictions?: any[];
  full_predictions?: Array<Array<{ token: string; id: number; prob: number }>>;
  full_predictions_normalized?: Array<Array<{ token: string; id: number; logit: number }>>;
  model_name: string;
  n_layers: number;
  n_heads: number;
};

export type StaticBigramData = {
  tokens: Array<{ id: number; text: string }>;
  predictions: Array<Array<{ token: string; prob: number; logit?: number }>>;
};

export type StaticCompletionsData = {
  tokens: Array<{ id: number; text: string }>;
  completions: Array<{
    prefix_length: number;
    completion_text: string;
    completion_tokens: string[];
    stopped_reason: string;
  }>;
};

export type StaticCompositionData = {
  q_composition: number[][];
  k_composition: number[][];
  v_composition: number[][];
};

const cache: Record<string, any> = {};

async function load<T>(path: string): Promise<T> {
  if (cache[path]) return cache[path];
  const resp = await fetch(path);
  const data = await resp.json();
  cache[path] = data;
  return data;
}

// Canonical data files
export const staticData = {
  quarterbackBigram: () => load<StaticBigramData>("/data/quarterback_bigram.json"),
  quarterbackAttnT1: () => load<StaticAttentionData>("/data/quarterback_attn_t1.json"),
  quarterbackCompletions: () => load<StaticCompletionsData>("/data/quarterback_completions.json"),
  hpAttnT1: () => load<StaticAttentionData>("/data/hp_attn_t1.json"),
  michaelAttnT1OV: () => load<StaticAttentionData>("/data/michael_attn_t1_ov.json"),
  committeeAttnT1OV: () => load<StaticAttentionData>("/data/committee_attn_t1_ov.json"),
  reganAttnT1: () => load<StaticAttentionData>("/data/regan_attn_t1.json"),
  reganAttnT2: () => load<StaticAttentionData>("/data/regan_attn_t2.json"),
  reganSpaceAttnT1: () => load<StaticAttentionData>("/data/regan_space_attn_t1.json"),
  reganSpaceAttnT2: () => load<StaticAttentionData>("/data/regan_space_attn_t2.json"),
  compositionScoresT2: () => load<StaticCompositionData>("/data/composition_scores_t2.json"),
};
