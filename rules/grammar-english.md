English grammar and style rules: spelling and confused words, grammatical agreement, verb forms and tenses, prepositions and idioms, pronoun case and reference, sentence structure and clauses, comparatives and determiners, passive voice, and noun pile-ups.

# Line Rules

## spelling_and_typos
Does the line contain a typo, misspelled word, swapped/missing/extra letters, or non-standard spelling?

### Criteria
- **true**: A word is misspelled or contains typographical errors (e.g. "fourty" for "forty", "pronounciation" for "pronunciation", "alot" for "a lot", "themself" for "themselves").
- **false**: All words are spelled correctly.

## homophones_and_contractions
Does the line confuse homophones, possessive forms, or apostrophe contractions?

### Criteria
- **true**: A word confuses sound-alike homophones or errs in contraction apostrophes (e.g. "its" for "it's", "your" for "you're", "there" for "their/they're", "whose" for "who's").
- **false**: Contractions and homophones are used with their correct grammatical meaning and spelling.

## confused_words
Does the line misuse a word from a commonly confused pair or false-friend pair?

### Criteria
- **true**: The line uses the wrong word from a pair with distinct meanings (e.g. "then" for "than", "loose" for "lose", "passed" for "past", "weather" for "whether", "pore" for "pour", "wreck" for "wreak", "averse" for "adverse", "disinterested" for "uninterested", "hardly" for "hard", "every day" for "everyday", "awhile" for "a while", "beside" for "besides", "bring" for "take", "can" for "may", "deadly" for "deathly", "farther" for "further", "early" for "soon").
- **false**: Words fit their precise semantic definition in context.

## grammatical_agreement
Does the line contain an agreement error in number between subject and verb, determiner and noun, or within correlative/collective constructions?

### Criteria
- **true**: The verb number mismatches the subject, or a quantifier mismatches its noun (e.g. "The list of features are" instead of "is"; "Every students is" instead of "Every student is"; "Each of the cars are" instead of "is"; "One of the train is" instead of "One of the trains is"; "The police is" instead of "are"; "Mathematics are" instead of "is"; "Either Jack or Joan are" instead of "is"; "The number of vehicles are" instead of "is"; "The ring as well as necklaces are" instead of "is").
- **false**: Subjects, verbs, quantifiers, and collective nouns agree correctly in grammatical number.

## verb_inflection
Does the line contain an error in verb inflection, irregular verb form, or auxiliary combination?

### Criteria
- **true**: A verb uses an incorrect principal part, past participle, or auxiliary combination (e.g. "did not saw" instead of "did not see"; "has ran" instead of "has run"; "suppose to" instead of "supposed to").
- **false**: Auxiliary verbs and inflected verb forms are used correctly.

## tense_and_sequence
Does the line contain an error in sequence of tenses, conditional/time-clause tense, or aspect/duration?

### Criteria
- **true**: A verb uses an incorrect tense sequence, invalid future tense in a conditional or time clause, or mismatched aspect (e.g. "If I will visit" instead of "If I visit"; "till they will finish" instead of "till they finish"; "succeeded because she works" instead of "worked"; "am waiting for two hours" instead of "have been waiting"; "have completed yesterday" instead of "completed yesterday").
- **false**: Tenses, time clauses, conditionals, and duration aspects align with standard grammar.

## subjunctive_mood
Does the line use an indicative verb where the subjunctive mood is required in a counterfactual or hypothetical clause?

### Criteria
- **true**: The line uses "was" instead of subjunctive "were" in contrary-to-fact wishes or conditional clauses (e.g. "If I was" in counterfactuals instead of "If I were"; "I wish he was here" instead of "were").
- **false**: Subjunctive "were" is used in counterfactual expressions, or indicative verbs are used in factual contexts.

## verb_complementation
Does the line err in verb complementation, confusing gerund and infinitive forms or omitting required complement particles?

### Criteria
- **true**: A verb takes the wrong complement structure (e.g. "enjoy to go" instead of "enjoy going"; "habit to arrive" instead of "habit of arriving"; "know to drive" instead of "know how to drive"; "nothing but to find" instead of "nothing but find").
- **false**: Verbs are followed by their idiomatic gerund, infinitive, or prepositional complement.

## preposition_and_collocation
Does the line use an incorrect, missing, or redundant preposition in an idiom, phrasal verb, temporal expression, or fixed collocation?

### Criteria
- **true**: A preposition is wrong, omitted where required, or redundantly added (e.g. "married with" instead of "married to"; "senior than" instead of "senior to"; "admission for" instead of "admission to"; "blind with one eye" instead of "blind in"; "In January 13th" instead of "On"; "since three months" instead of "for three months"; "during" vs "for" duration; "emphasizes on" instead of "emphasizes"; "came across with" instead of "came across"; "listen music" instead of "listen to music"; "waited on the train" instead of "waited for"; "due to fact that" instead of "due to the fact that"; "in my point of view" instead of "from my point of view" or "in my view").
- **false**: Prepositions and collocations match standard English idiomatic usage.

## pronoun_case
Does the line contain an error in pronoun case (subjective vs objective)?

### Criteria
- **true**: A pronoun appears in the objective case where subjective is required, or subjective where objective is required (e.g. "Smith and me went" instead of "Smith and I went"; "Let he go" instead of "Let him go"; "Whom called me?" instead of "Who"; "The person whom we met was..." where subjective "who" is intended).
- **false**: Pronouns appear in their correct grammatical case based on their syntactic role.

## pronoun_antecedent_and_order
Does the line contain a conflict in pronoun-antecedent agreement or awkward personal pronoun ordering?

### Criteria
- **true**: A pronoun conflicts with its antecedent in person/number, or violates conventional polite pronoun ordering (e.g. "One should respect his own" instead of "one's own"; "You, they and we" instead of "We, you and they").
- **false**: Pronouns agree consistently with their antecedents and follow natural ordering conventions.

## possessive_apostrophe
Does the line misuse possessive apostrophes in joint vs separate ownership or irregular noun forms?

### Criteria
- **true**: An apostrophe is misplaced or improperly duplicated in joint ownership constructions (e.g. "Smith's and Peter's car" for joint ownership instead of "Smith and Peter's car").
- **false**: Possessive apostrophes correctly reflect joint or individual ownership.

## run_on_and_comma_splice
Does the line contain a comma splice or a fused run-on sentence?

### Criteria
- **true**: Two independent clauses are joined with only a comma and no coordinating conjunction, or fused together with no boundary punctuation (e.g. "The build failed, we rolled back"; "The server crashed the team investigated").
- **false**: Independent clauses are properly joined with conjunctions, semicolons, or separated into distinct sentences.

## dangling_modifier
Does the line contain a dangling or misplaced modifier that attaches to the wrong subject?

### Criteria
- **true**: A participial phrase or descriptive modifier attaches illogically to the nearest noun rather than the intended actor, or an adverb is misplaced (e.g. "Running the tests, the bug was found"; "almost washed all of the cars" instead of "washed almost all").
- **false**: Modifiers clearly and logically attach to their intended subjects.

## double_negative
Does the line contain an improper double negative construction?

### Criteria
- **true**: Two negative words combine to create a non-standard negative expression (e.g. "didn't meet no one" instead of "didn't meet anyone"; "decided not to appoint him neither... nor...").
- **false**: Negation is expressed cleanly with single negative elements or standard positive constructions.

## redundant_conjunction
Does the line contain redundant conjunctions, correlatives, or stacked modals?

### Criteria
- **true**: Two conjunctions or modals are stacked redundantly, or a correlative structure is duplicated (e.g. "Although it was raining, but we went" instead of omitting "but"; "must have to" instead of choosing one; "too honest so that she cannot lie" instead of "too honest to lie"; "noticed the man lying ill and died" missing coordinate subject "he").
- **false**: Coordinating and subordinating conjunctions are used without redundancy.

## comparatives_and_superlatives
Does the line contain an error in comparative or superlative formation, absolute adjectives, or two vs three+ comparisons?

### Criteria
- **true**: A comparative or superlative is formed incorrectly, applied to an ungradable/absolute adjective, or confuses comparison between two versus three or more items (e.g. "more tall" instead of "taller"; "most unique" or "more perfect" for absolute adjectives; "Who's the best performer, John or Smith?" instead of "better"; "among the two" instead of "between").
- **false**: Comparatives and superlatives are formed according to standard inflection and grade distinctions.

## determiners_and_quantifiers
Does the line confuse countable versus uncountable determiners and quantifiers?

### Criteria
- **true**: A quantifier or determiner mismatches countability (e.g. "less dresses" instead of "fewer dresses"; "amount of people" instead of "number of people").
- **false**: Quantifiers and determiners match the countability of the noun they modify.

## article_usage
Does the line use an incorrect indefinite article ("a" vs "an"), misplace an article, or omit a required definite article?

### Criteria
- **true**: An article is phonetically mismatched ("a" before vowel sound or "an" before consonant sound), placed in the wrong order, or omitted where required (e.g. "a old" instead of "an old"; "an university" instead of "a university"; "the two last columns" instead of "the last two columns"; "Gita is his favourite book" missing required article "The").
- **false**: Articles are phonetically correct, placed properly, and present where required.

## passive_voice_overuse
Is the line written in passive voice where an active construction with a named subject would be clearer?

### Criteria
- **true**: The sentence hides the actor behind a passive construction ("was implemented", "has been decided") and naming the actor would make the sentence more direct.
- **false**: The passive is justified because the actor is unknown, irrelevant, or the object deserves emphasis.

## noun_pile_up
Does the line stack three or more nouns or noun-adjective modifiers in front of a head noun, making the phrase hard to parse (e.g. "enterprise customer onboarding flow optimization metrics")?

### Criteria
- **true**: A noun pile-up forces the reader to unpack which nouns modify which — splitting into a prepositional phrase would be clearer.
- **false**: Compound nouns are short, established, or immediately clear.
