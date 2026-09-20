Line-level rules to detect AI slop patterns: banned buzzwords, filler adverbs, empty phrases, puffery, rhetorical setups, and decorative closers.

# Line Rules

## banned_word
Does the line contain a word from this list: delve, foster, leverage, utilize, facilitate, empower, streamline, robust, cutting-edge, paradigm shift, game changer, tapestry, realm, beacon, multifaceted, meticulous, intricate, paramount, transformative, elevate, embark, supercharge, harness, ever-evolving?

### Criteria
- **true**: Any word from the list appears, including inflected forms (delving, leveraged, etc).
- **false**: None of these words appear.

## empty_adverb
Does the line use an adverb (just, literally, honestly, simply, actually, truly, fundamentally, importantly, crucially, inherently, inevitably) that adds nothing to the meaning?

### Criteria
- **true**: The adverb could be deleted without changing what the sentence says or the writer's emphasis.
- **false**: The adverb carries real emphasis, contrast, uncertainty, or spoken rhythm.

## empty_phrase
Does the line contain a filler phrase like "it's worth noting", "at the end of the day", "when it comes to", "at its core", "in today's world", "in the age of", "the reality is", "the truth is", "in terms of", "in order to", "going forward", "let's dive in" that delays the point?

### Criteria
- **true**: The phrase can be cut and the sentence still says the same thing.
- **false**: No such filler phrase, or the phrase is part of the writer's recognizable voice.

## binary_contrast
Does the line use a "not X, it's Y" or "not just X but Y" structure instead of stating Y directly?

### Criteria
- **true**: The line frames its point as a negation-then-reveal (e.g. "This isn't about speed. It's about trust.").
- **false**: The line states its point directly, or uses negation for genuine contrast.

## throat_clearing
Does the line open with a filler phrase like "Here's the thing," "Let me be clear," "I'll be honest," or "The uncomfortable truth is" before the actual point?

### Criteria
- **true**: The opening words are throat-clearing that delay the real sentence.
- **false**: The line opens with its point, or the lead-in carries real meaning.

## faux_insight
Does the line use a setup like "What most people get wrong," "Here's what nobody tells you," or "The part everyone misses" to frame the writer as the lone expert?

### Criteria
- **true**: The line uses an exclusivity claim as a setup rather than just making the point.
- **false**: The line makes its claim directly.

## colon_reveal
Does the line use a noun-phrase-colon-reveal pattern for dramatic effect (e.g. "The secret: it's all about timing")?

### Criteria
- **true**: A colon is used as a dramatic reveal device, not for a list, label, or quotation.
- **false**: No colon, or the colon introduces a list, definition, or quotation.

## negative_listing
Does the line use a "Not a X. Not a Y. A Z." pattern instead of just stating Z?

### Criteria
- **true**: The line builds through negations to reach its positive claim.
- **false**: The line states its point without stacking negations.

## dramatic_fragmentation
Does the line use punchy sentence fragments ("And that matters.", "That's it. That's the whole thing.") for effect instead of complete sentences?

### Criteria
- **true**: The line is a dramatic fragment or contains stacked fragment sentences.
- **false**: The line is a complete sentence, or the fragment is natural speech.

## rhetorical_setup
Does the line use a rhetorical setup like "What if I told you…", "Think about it:", "Plot twist:", or a self-answered question?

### Criteria
- **true**: The line uses a rhetorical device to tee up a point instead of stating it.
- **false**: The line makes its point directly.

## superficial_analysis
Does the line use a trailing -ing clause (highlighting, underscoring, reflecting, showcasing) that pretends to explain meaning without adding concrete information?

### Criteria
- **true**: The -ing clause gestures at significance without naming a concrete consequence, mechanism, or fact.
- **false**: The -ing clause describes a concrete action or outcome.

## importance_puffery
Does the line assert importance with empty phrases like "stands as a testament," "marks a pivotal moment," "plays a vital role," "solidifies its position," or "underscores its significance" instead of stating the fact?

### Criteria
- **true**: The line tells the reader something is important rather than showing why.
- **false**: The line states a concrete fact and lets the reader judge.

## interpretive_meta
Does the line step outside the subject to tell the reader what to notice or how much weight to give it, e.g. "That last part matters more than it sounds," "The key point is," "This distinction matters"?

### Criteria
- **true**: The line is metadiscourse that interprets the writing for the reader.
- **false**: The line stays within its subject.

## weasel_attribution
Does the line use vague sourcing like "Experts agree," "industry reports suggest," "many argue," "widely regarded as," or "studies show" without naming a specific source?

### Criteria
- **true**: The line invokes unnamed authority to support a claim.
- **false**: The line names a specific source, or makes the claim on its own terms.

## fake_strong_verb
Does the line use an inflated verb phrase ("serves as a centralized hub for," "drives innovation in") where a plain verb ("tracks," "is") would be clearer?

### Criteria
- **true**: A simpler verb would say the same thing more directly.
- **false**: The verb phrase carries real meaning that a plain verb would lose.

## synonym_cycling
Considering the surrounding lines, does the line rotate synonyms for a term already established nearby instead of repeating the clear word?

### Criteria
- **true**: The line swaps in a synonym (e.g. "the tool" then "the assistant" then "the platform") where repetition would be clearer.
- **false**: The term is consistent with surrounding lines, or the synonym adds a real distinction.

## fake_profound_kicker
Is this line a final "mic-drop" sentence: a cute metaphor, aphorism, or dramatic closer that restates the point as profundity instead of ending on a concrete fact?

### Criteria
- **true**: The line is a decorative closer that could be deleted, leaving a stronger ending.
- **false**: The line adds concrete information or a specific next action.

## summary_recap
Does the line begin a recap ending ("In conclusion," "Ultimately," "Overall,") or restate points already made?

### Criteria
- **true**: The line restates the piece's content without adding new information.
- **false**: The line introduces a new takeaway, action, or fact.

## formatting_slop
Does the line use emoji in a heading, gratuitous bold mid-sentence for emphasis, or unnecessary bullet/header formatting where prose would read better?

### Criteria
- **true**: The formatting decorates rather than clarifies.
- **false**: The formatting serves the content's structure.

## em_dash_crutch
Does the line overuse em dashes (— or --) as a rhythm crutch where commas, periods, or parentheses would be clearer?

### Criteria
- **true**: An em dash is used decoratively or where simpler punctuation works.
- **false**: The em dash is justified and beats the alternatives in this sentence.

## bold_lead_in_list
Does the line use a bold lead-in list format (e.g. "1. **Label:** text" or "- **Label:** text") to present narrative explanations, steps, or sequential thoughts that would read better as continuous prose rather than a list?

### Criteria
- **true**: The line is a numbered or bulleted list item with a bold label/title that forces narrative prose or sequential reasoning into an artificial list structure.
- **false**: The line is not a bold lead-in list item, or it belongs to a genuine reference list, technical checklist, API/spec listing, or set of distinct items where list structure clarifies the content.
