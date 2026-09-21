English grammar and style rules: spelling and confused words, grammatical agreement, verb forms and tenses, prepositions and idioms, pronoun case and reference, sentence structure and clauses, comparatives and determiners, passive voice, and noun pile-ups.

# Line Rules

## spelling_and_confused_words
Does the line contain a typo, misspelled word, incorrect homophone, erroneous contraction, or commonly confused word pair?

### Criteria
- **true**: A word is misspelled, contains swapped/missing/extra letters, confuses homophones or contractions, or uses the wrong word from a commonly confused pair (e.g. "fourty" for "forty", "pronounciation" for "pronunciation", "alot" for "a lot", "themself" for "themselves", "its" for "it's", "your" for "you're", "there" for "their/they're", "whose" for "who's", "then" for "than", "loose" for "lose", "passed" for "past", "weather" for "whether", "pore" for "pour", "wreck" for "wreak", "averse" for "adverse", "disinterested" for "uninterested", "hardly" for "hard", "every day" (adverb) for "everyday" (adjective), "awhile" for "a while", "beside" for "besides", "bring" for "take", "can" for "may", "deadly" for "deathly", "farther" for "further", "early" for "soon").
- **false**: Words are spelled correctly and fit the context with their intended meaning.

## grammatical_agreement
Does the line contain a grammatical agreement error in number between subject and verb, determiner and noun, or within correlative and collective constructions?

### Criteria
- **true**: The verb number mismatches the subject, or a quantifier mismatches its noun (e.g. "The list of features are" instead of "is"; "Every students is" instead of "Every student is"; "Each of the cars are" instead of "is"; "One of the train is" instead of "One of the trains is"; "The police is" instead of "are"; "Mathematics are" instead of "is"; "Either Jack or Joan are" instead of "is"; "The number of vehicles are" instead of "is"; "The ring as well as necklaces are" instead of "is").
- **false**: Subjects, verbs, quantifiers, and collective nouns agree correctly in grammatical number.

## verb_form_and_tense
Does the line contain an error in verb form, auxiliary usage, sequence of tenses, conditional/time-clause tense, duration aspect, subjunctive mood, or verb complementation (gerund vs infinitive)?

### Criteria
- **true**: A verb uses an incorrect inflection, auxiliary combination, tense, aspect, mood, or complement form (e.g. "did not saw" instead of "did not see"; "has ran" instead of "has run"; "suppose to" instead of "supposed to"; "If I will visit" instead of "If I visit"; "till they will finish" instead of "till they finish"; "succeeded because she works" instead of "worked"; "am waiting for two hours" instead of "have been waiting"; "have completed yesterday" instead of "completed yesterday"; "If I was" in counterfactual wishes instead of "If I were"; "enjoy to go" instead of "enjoy going"; "habit to arrive" instead of "habit of arriving"; "know to drive" instead of "know how to drive"; "nothing but to find" instead of "nothing but find").
- **false**: Verb tenses, auxiliary combinations, participles, conditionals, and gerund/infinitive forms are used correctly.

## preposition_and_collocation
Does the line use an incorrect, missing, or redundant preposition in an idiom, phrasal verb, temporal expression, or fixed collocation?

### Criteria
- **true**: A preposition is wrong, omitted where required, or redundantly added (e.g. "married with" instead of "married to"; "senior than" instead of "senior to"; "admission for" instead of "admission to"; "blind with one eye" instead of "blind in"; "In January 13th" instead of "On"; "since three months" instead of "for three months"; "during" vs "for" duration; "emphasizes on" instead of "emphasizes"; "came across with" instead of "came across"; "listen music" instead of "listen to music"; "waited on the train" instead of "waited for"; "due to fact that" instead of "due to the fact that"; "in my point of view" instead of "from my point of view" or "in my view").
- **false**: Prepositions and collocations match standard English idiomatic usage.

## pronoun_case_and_reference
Does the line contain an error in pronoun case (subjective vs objective), pronoun-antecedent consistency, pronoun ordering, or possessive apostrophe placement?

### Criteria
- **true**: A pronoun uses the wrong grammatical case, conflicts with its antecedent, or uses incorrect order or apostrophe placement (e.g. "Smith and me went" instead of "Smith and I went"; "Let he go" instead of "Let him go"; "Whom called me?" instead of "Who"; "The person whom we met was..." where subjective "who" is intended; "One should respect his own" instead of "one's own"; "Smith's and Peter's car" for joint ownership instead of "Smith and Peter's car"; "You, they and we" instead of "We, you and they").
- **false**: Pronouns match their required case, order, and antecedents, and possessives are formed correctly.

## sentence_structure_and_clauses
Does the line contain a comma splice, run-on sentence, dangling or misplaced modifier, double negative, redundant correlative, or missing coordinate subject?

### Criteria
- **true**: Clauses are improperly joined, modifiers are misplaced or dangling, or the structure contains double negatives or redundant conjunctions (e.g. "The build failed, we rolled back" without a coordinating conjunction; "The server crashed the team investigated" with no boundary punctuation; "Running the tests, the bug was found" where the modifier attaches to the wrong subject; "almost washed all of the cars" instead of "washed almost all"; "didn't meet no one" instead of "anyone"; "decided not to appoint him neither... nor..."; "Although it was raining, but we went" instead of omitting "but"; "must have to" instead of choosing one; "too honest so that she cannot lie" instead of "too honest to lie"; "noticed the man lying ill and died" missing subject "he").
- **false**: Clauses are properly joined, modifiers attach to their intended subjects, and sentence structures avoid double negatives and redundant conjunctions.

## comparatives_and_determiners
Does the line contain an error in comparative or superlative formation, absolute/ungradable adjectives, two vs three+ comparisons, countable vs uncountable determiners, or article selection?

### Criteria
- **true**: A comparative or determiner is incorrectly formed or used (e.g. "more tall" instead of "taller"; "most unique" or "more perfect" for absolute adjectives; "Who's the best performer, John or Smith?" instead of "better"; "among the two" instead of "between"; "less dresses" instead of "fewer dresses"; "amount of people" instead of "number of people"; "a old" instead of "an old"; "an university" instead of "a university"; "the two last columns" instead of "the last two columns"; "Gita is his favourite book" missing required article "The").
- **false**: Comparatives, superlatives, determiners, quantifiers, and articles are used correctly.

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
