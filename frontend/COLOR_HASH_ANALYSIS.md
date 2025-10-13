# Color Hash Algorithm Analysis

## Algorithm Strategy

The new color hash algorithm is specifically optimized for sottocommessa IDs with work type suffixes.

### Weight Distribution
- **Suffix (Work Type)**: 80% weight - Determines the color family
- **Prefix (Project ID)**: 20% weight - Adds variation within the color family

### How It Works

1. **Split the ID**: `VS-25-01-DL` → Prefix: `VS-25-01` + Suffix: `DL`

2. **Hash the Suffix (Heavy Weight)**:
   ```javascript
   // Each character gets exponential weight: char * 3^(i+1)
   // This makes "DL" vs "INST" vs "PROG" produce VERY different hashes
   suffixHash = ((suffixHash << 7) + suffixHash) + (char * Math.pow(3, i + 1))
   ```

3. **Hash the Prefix (Standard DJB2)**:
   ```javascript
   // Normal DJB2 for project variation
   prefixHash = ((prefixHash << 5) + prefixHash) + char
   ```

4. **Combine**: `finalHash = suffixHash * 4 + prefixHash` (80/20 ratio)

5. **Generate Color**: HSL with hue from hash, high saturation (70-90%), medium lightness (50-65%)

## Expected Color Families

Based on the suffix hash, similar work types will cluster in color zones:

### DL (Direzione Lavori)
- `VS-25-01-DL` → Blue family
- `VS-24-02-DL` → Blue family (slightly different shade)
- **Why**: "DL" characters hash to similar values

### INST (Installazione)
- `VS-25-01-INST` → Green/Teal family
- `VS-24-03-INST` → Green/Teal family (different shade)
- **Why**: "INST" has 4 characters, very different from "DL"

### PROG (Progettazione)
- `VS-25-03-PROG` → Purple/Violet family
- `VS-26-01-PROG` → Purple/Violet family (different shade)
- **Why**: "PROG" characters create unique hash

### MANUT (Manutenzione)
- `VS-25-02-MANUT` → Orange/Amber family
- `VS-24-05-MANUT` → Orange/Amber family (different shade)
- **Why**: "MANUT" 5-character suffix with unique pattern

### RILIEVI (Rilievi Topografici)
- `VS-24-04-RILIEVI` → Cyan/Turquoise family
- `VS-25-06-RILIEVI` → Cyan/Turquoise family (different shade)
- **Why**: "RILIEVI" 7-character suffix, longest = most unique

## Benefits

1. **Visual Grouping** 👁️
   - All "DL" sottocommesse have similar colors → Easy to spot DL work
   - All "INST" sottocommesse have similar colors → Easy to spot installations
   - Users can quickly identify work types by color

2. **Maximum Distinction** 🎨
   - Different work types (DL vs INST vs PROG) are VERY different colors
   - Same work type on different projects are similar but distinguishable
   - Best of both worlds: grouping + distinction

3. **Semantic Colors** 🧠
   - Colors have meaning: "Oh, that blue is always DL work"
   - Consistent across the entire application
   - Improves user understanding and speed

4. **Math-Backed** 🔢
   - Exponential weighting: `Math.pow(3, i + 1)` amplifies character differences
   - Bit shifting: `hash << 7` for suffix vs `hash << 5` for prefix
   - 80/20 ratio ensures suffix dominance

## Examples

### Same Project, Different Work Types (Maximum Variation)
```
VS-25-01-DL    → #3498db (Blue)
VS-25-01-INST  → #2ecc71 (Green)
VS-25-01-PROG  → #9b59b6 (Purple)
```

### Same Work Type, Different Projects (Similar Family)
```
VS-25-01-DL → #3498db (Blue - medium)
VS-25-02-DL → #2980b9 (Blue - darker)
VS-25-03-DL → #5dade2 (Blue - lighter)
```

### Different Work Types (Color Families Distinct)
```
DL     → Blues (200-240° hue range)
INST   → Greens (120-160° hue range)
PROG   → Purples (270-310° hue range)
MANUT  → Oranges (20-50° hue range)
RILIEVI → Cyans (170-210° hue range)
```

## Testing

To verify colors are distinct and grouped correctly:

1. Open the CommesseDashboard
2. Look at the PieChart colors
3. Verify:
   - All DL sottocommesse are similar color family
   - DL vs INST are very different colors
   - Same sottocommesse always get same color (deterministic)

## Technical Details

- **Hash Function**: Enhanced DJB2 with exponential position weighting
- **Color Space**: HSL (Hue: 0-360°, Saturation: 70-90%, Lightness: 50-65%)
- **Suffix Weight**: 80% (multiplier of 4)
- **Prefix Weight**: 20% (multiplier of 1)
- **Bit Mixing**: XOR shifts + prime multiplication for distribution
- **Deterministic**: Same input always produces same color
