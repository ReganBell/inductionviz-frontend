# Induction Head Evolution Project - Status

## Overview
Building an interactive visualization to demonstrate **evolutionary exaptation** in neural networks: how previous token heads emerge first (useful for repeated characters), then induction heads develop to leverage this signal.

## Current Status: Phase 1 Complete ✅

### ✅ Phase 1: Training Infrastructure (COMPLETE)
**Location**: `~/emotion/`

**Files Created**:
- `train_induction_evolution.py` - Complete training script with MPS support
- `INDUCTION_EVOLUTION_PLAN.md` - Full implementation plan
- `CONTEXT_SUMMARY.md` - Handoff document for context continuity
- `TRAINING_README.md` - User guide for the training script

**What's Implemented**:
- Train `attn-only-2l` from scratch on OpenWebText with NeoX tokenizer
- Checkpoint every 100 steps with comprehensive metrics
- Previous token head detection (attention to position i-1)
- Induction head detection (match index logic)
- Q/K/V composition analysis between L0 and L1 heads
- Probe sentence evaluation at each checkpoint
- MPS device support for Mac GPU

**Checkpoint Contents**:
Each checkpoint includes:
- Full model state (can resume training or inference)
- Head metrics for all 8 heads (prev_token_score, induction_score, q_composition)
- Composition matrices (Q/K/V between L0 and L1)
- Probe sentence results (Nightjar, repeated chars, simple repetition, ABC pattern)
- Training metadata (lr, examples seen, etc.)

**How to Run Training**:
```bash
cd ~/emotion
uv run python train_induction_evolution.py
```

Training takes ~2-4 hours on MPS, saves ~100 checkpoints (~50-70 GB total).

---

### ⏳ Phase 2: Backend API (NOT STARTED)
**Location**: `~/inductionviz-backend/app.py`

**Required Endpoints**:
```python
GET  /api/evolution/checkpoints
POST /api/evolution/checkpoint/{step}
POST /api/evolution/analyze-text
```

**Tasks**:
- [ ] Add checkpoint listing endpoint (metadata only)
- [ ] Add checkpoint data endpoint (load and return metrics)
- [ ] Add custom text analysis with checkpoint model
- [ ] Test API responses with sample checkpoints

**Estimated Time**: 2-4 hours

---

### ⏳ Phase 3: Frontend Components (NOT STARTED)
**Location**: `~/inductionviz-frontend/src/`

**New Page**: `src/pages/Evolution.tsx`

**Components to Build**:
- [ ] `EpochScrubber.tsx` - Timeline slider with loss curve background
- [ ] `HeadEvolutionGrid.tsx` - 8 head cards, color-coded by type
- [ ] `HeadCard.tsx` - Single head display with attention heatmap + metrics
- [ ] `LossChart.tsx` - Line chart showing total loss + per-head-type contribution
- [ ] `CompositionMatrix.tsx` - Animated L1×L0 Q-composition heatmap
- [ ] `ProbeSentenceWidget.tsx` - Show Nightjar example predictions over time

**Design Language** (from CLAUDE.md):
- Colors: Off-white (#FCFCFC), warm gray (#EDEAE6), ink (#0E1111), accent green (#2ECF8B)
- Head colors: 🟢 prev-token, 🟣 induction, ⚪ other
- Motion: Crisp, snap-to, purposeful
- Layout: App-like, tight components

**Routing**:
Add "Evolution" view option to existing view switcher in `main.tsx`

**Estimated Time**: 1-2 days

---

### ⏳ Phase 4: Polish & Testing (NOT STARTED)
**Tasks**:
- [ ] Add animations and smooth transitions between checkpoints
- [ ] Add explanatory text and tooltips
- [ ] Test with real checkpoint data
- [ ] Verify narrative flow
- [ ] Performance optimization (lazy loading, caching)

**Estimated Time**: 4-8 hours

---

## Key Hypothesis

**Evolutionary Exaptation**:
1. Previous token heads emerge first → useful for repeated characters (!!, ??)
2. Induction heads can't develop without previous token signal
3. Previous token heads must be useful standalone (optimization pressure)
4. Induction heads then "exapt" this signal for pattern matching
5. Loss decreases measurably at each stage

## Expected Timeline

**Training Observation** (after running training script):
- Steps 0-2000: Random initialization, high loss
- Steps 2000-4000: Previous token heads emerge (prev_token_score > 0.4)
- Steps 4000-6000: Q-composition signal builds
- Steps 6000-8000: Induction heads emerge (induction_score > 0.3)
- Steps 8000+: Stable collaboration, low loss

## Next Steps

1. **Run training** (`cd ~/emotion && uv run python train_induction_evolution.py`)
2. **Analyze checkpoints** to verify emergence pattern
3. **Build backend API** (Phase 2) to serve checkpoint data
4. **Build frontend** (Phase 3) to visualize evolution
5. **Polish** (Phase 4) with animations and narrative

## Resources

- **Training docs**: `~/emotion/TRAINING_README.md`
- **Full plan**: `~/emotion/INDUCTION_EVOLUTION_PLAN.md`
- **Context summary**: `~/emotion/CONTEXT_SUMMARY.md` (for handoff to another Claude instance)
- **Backend codebase**: `~/inductionviz-backend/`
- **Frontend codebase**: `~/inductionviz-frontend/` (current repo)

## Notes

- Checkpoints saved to: `~/emotion/checkpoints/induction_evolution/`
- Each checkpoint ~500-700 MB
- Training uses MPS (Mac GPU)
- Dataset: OpenWebText with NeoX tokenizer
- Model: attn-only-2l (2 layers, 4 heads each, attention-only)

---

**Last Updated**: 2025-11-04
**Status**: Phase 1 complete, ready to start training
