# Quiz-to-Earn Reward Recommendations

## Current Setup Analysis

### Current Configuration
- **Action Value**: 0.01 KAS per correct answer
- **Reward Rate**: 100 basis points (1%)
- **Current Reward**: 0.01 × 1% = **0.0001 KAS worth of GRID tokens**
- **GRID Token Max Supply**: 10 billion GRID

### Problem
The current reward is too small (0.0001 GRID equivalent), making it barely noticeable to users.

## Recommended Options

### Option 1: Moderate Reward (Recommended) ⭐
**Configuration:**
- **Action Value**: 1 KAS per correct answer
- **Reward Rate**: 100 basis points (1%)
- **Reward**: 1 × 1% = **0.01 GRID tokens per correct answer**

**Pros:**
- Sustainable (small, incremental rewards)
- Aligns with "Small Action" category (50-200 bp)
- Easy to understand (1% of 1 KAS)
- Low token consumption

**Cons:**
- May seem small to users initially
- Requires 1 KAS actionValue (higher than current 0.01 KAS)

**Sustainability:** ✅ Excellent
- 10,000 correct answers = 100 GRID tokens
- 1 million correct answers = 10,000 GRID tokens
- Very sustainable for 10B GRID supply

---

### Option 2: Balanced Reward
**Configuration:**
- **Action Value**: 10 KAS per correct answer
- **Reward Rate**: 100 basis points (1%)
- **Reward**: 10 × 1% = **0.1 GRID tokens per correct answer**

**Pros:**
- More noticeable reward
- Still sustainable
- Good balance between incentive and sustainability

**Cons:**
- Higher actionValue (10 KAS vs 1 KAS)
- 10x more token consumption than Option 1

**Sustainability:** ✅ Good
- 10,000 correct answers = 1,000 GRID tokens
- 1 million correct answers = 100,000 GRID tokens
- Sustainable for 10B GRID supply

---

### Option 3: Generous Reward
**Configuration:**
- **Action Value**: 100 KAS per correct answer
- **Reward Rate**: 100 basis points (1%)
- **Reward**: 100 × 1% = **1 GRID token per correct answer**

**Pros:**
- Round number (easy to understand)
- Significant incentive for users
- Clear value proposition

**Cons:**
- Higher actionValue (100 KAS)
- 100x more token consumption than Option 1
- May be too generous for long-term sustainability

**Sustainability:** ⚠️ Moderate
- 10,000 correct answers = 10,000 GRID tokens
- 1 million correct answers = 1,000,000 GRID tokens
- Still sustainable but requires careful monitoring

---

### Option 4: Increased Rate Approach
**Configuration:**
- **Action Value**: 0.1 KAS per correct answer
- **Reward Rate**: 1000 basis points (10%)
- **Reward**: 0.1 × 10% = **0.01 GRID tokens per correct answer**

**Pros:**
- Lower actionValue (0.1 KAS)
- Higher percentage feels more rewarding
- Same result as Option 1

**Cons:**
- 10% rate is high for "Small Action" category
- Deviates from standard 1% rate
- May set precedent for other dApps

**Sustainability:** ✅ Same as Option 1

---

## Comparison Table

| Option | Action Value | Rate | GRID Reward | Sustainability | User Appeal |
|--------|-------------|------|-------------|----------------|-------------|
| **Option 1** ⭐ | 1 KAS | 1% | 0.01 GRID | ✅ Excellent | ⭐⭐⭐ |
| **Option 2** | 10 KAS | 1% | 0.1 GRID | ✅ Good | ⭐⭐⭐⭐ |
| **Option 3** | 100 KAS | 1% | 1 GRID | ⚠️ Moderate | ⭐⭐⭐⭐⭐ |
| **Option 4** | 0.1 KAS | 10% | 0.01 GRID | ✅ Excellent | ⭐⭐⭐ |

## Recommendation: Option 1 (Moderate Reward)

### Why Option 1?
1. **Sustainable**: Very low token consumption
2. **Standard**: Uses recommended 1% rate for small actions
3. **Scalable**: Can handle millions of quiz answers
4. **Balanced**: Good incentive without over-rewarding
5. **Flexible**: Easy to adjust later if needed

### Implementation
```bash
# Update contract to use 1 KAS actionValue
REWARD_AMOUNT=1 npx hardhat run scripts/update-quiz-reward-amount.js --network kasplexL2Testnet
```

### Alternative: Option 2 (If users want more visible rewards)
If 0.01 GRID feels too small, Option 2 (0.1 GRID) provides 10x more while still being sustainable.

---

## Long-term Considerations

### Token Supply Management
- **Total Supply**: 10 billion GRID
- **Current Usage**: Minimal (testnet)
- **Future Growth**: Monitor distribution rate

### Scaling Strategy
1. **Start Conservative**: Begin with Option 1 (0.01 GRID)
2. **Monitor Usage**: Track quiz participation and token distribution
3. **Adjust Gradually**: Increase reward if needed, but stay sustainable
4. **Consider Tiers**: Different rewards for easy/medium/hard questions

### Example Scenarios

**Scenario 1: Low Activity**
- 1,000 correct answers/day
- Option 1: 10 GRID/day = 3,650 GRID/year ✅
- Option 2: 100 GRID/day = 36,500 GRID/year ✅
- Option 3: 1,000 GRID/day = 365,000 GRID/year ⚠️

**Scenario 2: High Activity**
- 10,000 correct answers/day
- Option 1: 100 GRID/day = 36,500 GRID/year ✅
- Option 2: 1,000 GRID/day = 365,000 GRID/year ⚠️
- Option 3: 10,000 GRID/day = 3,650,000 GRID/year ❌

---

## Final Recommendation

**Use Option 1 (0.01 GRID per correct answer)** with the ability to adjust to Option 2 (0.1 GRID) if needed.

This provides:
- ✅ Sustainable token distribution
- ✅ Clear incentive for users
- ✅ Room for growth
- ✅ Easy to adjust later

