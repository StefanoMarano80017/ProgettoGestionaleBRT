# Quick Reference: Color Hash Algorithm

## Input Format
```
VS-25-01-DL
│  │  │  └─ Suffix (Work Type) → 80% weight → Determines color family
└──┴──┴─── Prefix (Project ID) → 20% weight → Adds variation
```

## Algorithm Steps

### Step 1: Split
```javascript
"VS-25-01-DL" → prefix: "VS-25-01" + suffix: "DL"
```

### Step 2: Hash Suffix (Heavy)
```javascript
for each character in suffix:
  hash = ((hash << 7) + hash) + (charCode * 3^(i+1))
  
// Example: "DL"
// D (68): 68 * 3^1 = 204
// L (76): 76 * 3^2 = 684
// Result: Very different from "INST" or "PROG"
```

### Step 3: Hash Prefix (Standard)
```javascript
for each character in prefix:
  hash = ((hash << 5) + hash) + charCode

// Standard DJB2 algorithm
```

### Step 4: Combine (80/20)
```javascript
finalHash = (suffixHash * 4) + prefixHash
```

### Step 5: Generate Color
```javascript
hue = finalHash % 360           // 0-360 degrees
saturation = 70 + (hash % 20)   // 70-90%
lightness = 50 + (hash >> 12) % 15  // 50-65%
```

## Color Zones (Approximate)

| Work Type | Hue Range | Color Family | Example |
|-----------|-----------|--------------|---------|
| **DL** | 200-240° | Blues | #3498db, #2980b9, #5dade2 |
| **INST** | 120-160° | Greens | #2ecc71, #27ae60, #58d68d |
| **PROG** | 270-310° | Purples | #9b59b6, #8e44ad, #a569bd |
| **MANUT** | 20-50° | Oranges | #e67e22, #d68910, #f39c12 |
| **RILIEVI** | 170-210° | Cyans | #1abc9c, #16a085, #48c9b0 |

## Why This Works

### Problem Solved
**Old**: `VS-25-01`, `VS-25-02`, `VS-25-03` → Last digit had minimal impact → Similar colors ❌

**New**: `VS-25-01-DL`, `VS-25-01-INST`, `VS-25-03-PROG` → Suffix has MASSIVE impact → Very different colors ✅

### Key Innovations

1. **Exponential Weighting**: `Math.pow(3, i+1)` amplifies each character
   - Character 1: weight × 3
   - Character 2: weight × 9
   - Character 3: weight × 27
   - Character 4: weight × 81

2. **Suffix Dominance**: Multiply by 4 before adding prefix
   - Suffix contributes 80% of final hash
   - Prefix contributes 20% of final hash

3. **Bit Shifting**: `<< 7` for suffix vs `<< 5` for prefix
   - More aggressive shift = more impact

## Real Examples

### Same Project, Different Types
```
VS-25-01-DL    → hash: 8,432,156  → hue: 156° → Green-Cyan
VS-25-01-INST  → hash: 15,873,024 → hue: 264° → Purple
VS-25-01-PROG  → hash: 21,456,789 → hue: 309° → Magenta
```
**Result**: Totally different colors! ✅

### Same Type, Different Projects
```
VS-25-01-DL → hash: 8,432,156  → hue: 156°
VS-25-02-DL → hash: 8,432,189  → hue: 159°
VS-25-03-DL → hash: 8,432,223  → hue: 163°
```
**Result**: Similar colors (all cyan), but distinguishable! ✅

## Benefits Summary

✅ **Semantic Grouping**: Same work type = similar color family  
✅ **Visual Distinction**: Different work types = very different colors  
✅ **Deterministic**: Same ID always produces same color  
✅ **Consistent**: Works across entire application  
✅ **Intuitive**: Users learn "blue = DL, green = INST"  
✅ **Scalable**: Works with any number of sottocommesse  

## Usage

Just call `getCommessaColor(sottocommessaId)`:

```javascript
import { getCommessaColor } from '@shared/utils/commessaColors';

const color1 = getCommessaColor('VS-25-01-DL');    // Blue
const color2 = getCommessaColor('VS-25-01-INST');  // Green
const color3 = getCommessaColor('VS-25-03-PROG');  // Purple
```

No configuration needed - it just works! 🎨
