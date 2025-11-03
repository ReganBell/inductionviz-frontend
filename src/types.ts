export type ModelKey = "bigram" | "t1" | "t2";

export type TokenInfo = {
  id: number;
  text: string;
};

export type TopItem = {
  token: string;
  id: number;
  logit: number;
  prob: number;
};

export type HeadDelta = {
  magnitude: number;
  actual_token_delta: number;
  top_promoted: Array<{ token: string; id: number; delta: number }>;
  top_suppressed: Array<{ token: string; id: number; delta: number }>;
};

export type PositionInfo = {
  t: number;
  context_token: TokenInfo;
  next_token: TokenInfo;
  topk: Record<ModelKey, TopItem[] | null>;
  attn: { t1: number[][][]; t2: number[][][] };
  value_weighted_attn: { t1: number[][][]; t2: number[][][] };
  head_deltas: { t1: Record<string, HeadDelta>; t2: Record<string, HeadDelta> };
  losses: Record<ModelKey, number | null>;
  bigram_available: boolean;
  match_index: number | null;
  match_attention: { t1: number; t2: number } | null;
  skip_trigram: boolean;
};

export type AnalysisResponse = {
  tokens: TokenInfo[];
  positions: PositionInfo[];
  device: string;
  t1_layers: number;
  t1_heads: number;
  t2_layers: number;
  t2_heads: number;
};

export type AblationResult = {
  with_head: TopItem[];
  without_head: TopItem[];
  delta_positive: TopItem[];
  delta_negative: TopItem[];
};

export type CompositionScores = {
  q_composition: number[][];
  k_composition: number[][];
  v_composition: number[][];
};

export type HeatmapProps = {
  matrix: number[][];
  size?: number;
  title?: string;
};

export type AttentionPatternsRequest = {
  text: string;
  model_name: "t1" | "t2";
  layers?: number[];
  heads?: number[];
};

export type AttentionPatternsResponse = {
  tokens: TokenInfo[];
  attention: number[][][][];  // [position][layer][head][src_position]
  model_name: string;
  n_layers: number;
  n_heads: number;
};


