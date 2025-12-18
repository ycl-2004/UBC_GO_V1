# Course Requirement Formatting Rules

## Rule: Separate Bullets vs. Combined with "OR"

### When to Keep Items SEPARATE (multiple lines)
If the UBC website shows requirements as **separate bullet points**, keep them as separate items:

#### Example: Saskatchewan - Music
**UBC Website shows:**
- • English A30
- • English B30
- • Audition, portfolio...

**Our page shows (CORRECT):**
- ✓ English Language Arts A30
- ✓ English Language Arts B30
- ✓ Audition, portfolio...

**Mapping:**
```json
"A Grade 12 English": [
  "English Language Arts A30",
  "English Language Arts B30"
]
```
→ Returns 2 separate items in the array

---

### When to COMBINE with "OR" (single line)
If the UBC website shows requirements **on the same line with "or"**, keep them combined:

#### Example: Alberta - Applied Biology
**UBC Website shows:**
- • English Language Arts 30-1
- • Math 30-1 or Math 31 (5 credits)
- • Biology 30, Chemistry 30, or Physics 30

**Our page shows (CORRECT):**
- ✓ English Language Arts 30-1
- ✓ Math 30-1 or Math 31 (5 credits)
- ✓ Biology 30, Chemistry 30, or Physics 30

**Mapping:**
```json
"A Grade 12 Pre-Calculus": ["Math 30-1 or Math 31 (5 credits)"]
"A Grade 12 Biology, a Grade 12 Chemistry, or a Grade 12 Physics": [
  "Biology 30, Chemistry 30, or Physics 30"
]
```
→ Returns 1 item with "or" in the string

---

### Summary of the Rule
🔹 **Separate bullets on website** = Separate items in mapping array = Separate lines in UI
🔹 **Same line with "or" on website** = Single item with "or" in mapping = Single line in UI

### Provinces Following This Rule

| Province | English Requirement Format |
|----------|---------------------------|
| Saskatchewan | Separate lines (A30 and B30) |
| Alberta | Single line (only 30-1) |
| British Columbia | Single line with "or" (Studies 12 or First Peoples 12) |
| Ontario | Single line (ENG4U) |
| Prince Edward Island | Single line with "or" (ENG611 or ENG621) |
| Quebec | Single line with "or" (603 or 604) |

---

## Implementation in Code

The mapping script uses `extend()` to add items:
```python
new_g12.extend(mapped)  # If mapped = ["A", "B"], both added separately
```

- If mapping returns `["Course A", "Course B"]` → Creates 2 separate requirements
- If mapping returns `["Course A or Course B"]` → Creates 1 combined requirement
