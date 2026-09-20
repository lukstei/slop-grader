Deutsche Grammatik- und Stilregeln: Tippfehler, Kommasetzung bei Nebensätzen, Verbendstellung, Kasuskongruenz, Deppenleerzeichen, Anglizismen und bürokratische Negationsstellung.

# Line Rules

## typo_or_misspelling
Enthält die Zeile einen Tippfehler, Rechtschreibfehler oder ein falsch verwendetes Wort (ein existierendes Wort, das im Kontext keinen Sinn ergibt)?

### Criteria
- **true**: Ein Wort ist falsch geschrieben, hat vertauschte/fehlende/überzählige Buchstaben, oder es wird ein existierendes deutsches Wort verwendet, das im Kontext nicht passt (z. B. „Vorraussetzung“ statt „Voraussetzung“, „seit“ statt „seid“, „das“ statt „dass“).
- **false**: Alle Wörter sind korrekt geschrieben und im richtigen Kontext verwendet.

## missing_comma_subordinate
Fehlt vor einem Nebensatz (eingeleitet durch dass, weil, wenn, obwohl, damit, da, als, während, ob, nachdem, bevor, sobald, falls, indem, seit, bis, wie, wo, oder ein Relativpronomen) das erforderliche Komma?

### Criteria
- **true**: Ein Nebensatz beginnt ohne vorausgehendes Komma, obwohl die deutsche Rechtschreibung dort eines verlangt.
- **false**: Alle Nebensätze sind korrekt durch Kommas abgetrennt, oder die Zeile enthält keinen Nebensatz.

## wrong_verb_position_subordinate
Steht das finite Verb in einem Nebensatz nicht an der korrekten letzten Position (Verbendstellung)?

### Criteria
- **true**: In einem dass-/weil-/wenn-/ob-/Relativsatz steht das konjugierte Verb nicht am Satzende (z. B. „weil er hat keine Zeit“ statt „weil er keine Zeit hat“).
- **false**: Das finite Verb steht korrekt am Ende des Nebensatzes, oder die Zeile enthält keinen Nebensatz.

## case_agreement_error
Enthält die Zeile einen Fehler in der Kasuskongruenz — stimmt der Artikel, das Adjektiv oder das Pronomen nicht mit dem grammatischen Fall (Nominativ, Akkusativ, Dativ, Genitiv) überein?

### Criteria
- **true**: Ein Artikel, Adjektiv oder Pronomen steht im falschen Kasus (z. B. „mit den neuen System“ statt „mit dem neuen System“; „wegen dem Wetter“ statt „wegen des Wetters“).
- **false**: Alle Artikel, Adjektive und Pronomen stimmen korrekt mit dem geforderten Kasus überein.

## compound_noun_split
Wird ein deutsches Kompositum fälschlich getrennt geschrieben (Deppenleerzeichen)?

### Criteria
- **true**: Ein zusammengesetztes Substantiv ist durch ein Leerzeichen getrennt, wo es zusammengeschrieben werden muss (z. B. „Projekt Manager“ statt „Projektmanager“, „Qualitäts Kontrolle“ statt „Qualitätskontrolle“).
- **false**: Komposita sind korrekt zusammengeschrieben, oder die Getrenntschreibung ist orthografisch zulässig.

## anglicism_where_german_exists
Verwendet die Zeile einen unnötigen Anglizismus, für den ein gebräuchliches, präzises deutsches Wort existiert und im Kontext natürlicher klingt?

### Criteria
- **true**: Ein englisches Lehnwort wird benutzt, obwohl das deutsche Äquivalent gängiger und klarer wäre (z. B. „Turnaround-Zeit“ statt „Lieferzeit“, „performen“ statt „leisten/abschneiden“).
- **false**: Der Anglizismus ist im Fachkontext etabliert und hat kein gleichwertiges deutsches Wort, oder die Zeile enthält keinen Anglizismus.

## bureaucratic_negation_order
Steht die Negationspartikel „nicht“ unnatürlich weit vom Verb entfernt am Satzende, statt natürlich vor dem Bezugswort zu stehen?

### Criteria
- **true**: Die Verneinung klingt bürokratisch steif, weil „nicht“ ans Satzende geschoben wurde (z. B. „haftet für den Schaden nicht“ statt „haftet nicht für den Schaden“).
- **false**: Die Wortstellung der Verneinung ist natürlich und klingt wie gesprochenes Deutsch.
