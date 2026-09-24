Ruleset for E2E testing: buzzword check and document density.

# Document Rules

## document_density
Evaluate information density and conciseness across the whole document.

### Criteria
- Weak — repetitive, verbose, or low information content
- Adequate — mostly concise with occasional filler
- Excellent — dense, crisp, and high-signal throughout

# Line Rules

## buzzword_check
Does the line contain empty corporate buzzwords like leverage, synergy, or empower?

### Criteria
- **true**: The line contains corporate buzzwords or empty filler jargon.
- **false**: The line uses direct, concrete language.
