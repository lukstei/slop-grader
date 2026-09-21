Deutsche Grammatik-, Rechtschreib- und Zeichensetzungsregeln: Rechtschreibung und verwechselte Wörter, Kongruenz und Formenlehre, Satzbau und Wortstellung sowie Zeichensetzung und Typografie.

# Line Rules

## spelling_and_typos
Enthält die Zeile einen Rechtschreibfehler, Tippfehler oder eine fehlerhafte Pluralform eines Nomens oder Fremdworts?

### Criteria
- **true**: Ein Wort ist orthografisch falsch geschrieben, vertauscht Buchstaben oder bildet eine unzulässige Pluralform (z. B. „Vorraussetzung“ statt „Voraussetzung“, „das“ statt „dass“, „seit“ statt „seid“, „Risikos“ statt „Risiken“, „Atlasse“ statt „Atlanten“, „Kaktusse“ statt „Kakteen“, „Modusse“ statt „Modi“, „Museums“ statt „Museen“, „Virusse“ statt „Viren“).
- **false**: Alle Wörter sind orthografisch korrekt geschrieben und Pluralformen sind normgerecht gebildet.

## compound_spacing
Enthält die Zeile ein fälschlich mit Leerzeichen getrenntes zusammengesetztes Nomen (Deppenleerzeichen)?

### Criteria
- **true**: Ein deutsches Kompositum ist unzulässig mit Leerzeichen getrennt anstatt zusammen- oder durchgekoppelt geschrieben zu werden (z. B. „Projekt Manager“ statt „Projektmanager“ oder „Projekt-Manager“, „Qualitäts Kontrolle“ statt „Qualitätskontrolle“).
- **false**: Zusammengesetzte Wörter sind korrekt zusammengeschrieben oder regelgerecht mit Bindestrich gekoppelt.

## confused_words
Enthält die Zeile ein verwechseltes Wortpaar oder Schein-Synonym mit abweichender Bedeutung?

### Criteria
- **true**: Ein Wort wird mit einem bedeutungsverwandten Begriff verwechselt, insbesondere „dasselbe“ (numerisch identischer Gegenstand) vs. „das gleiche“ (artgleiches Exemplar oder Kopie), z. B. „Er kaufte dasselbe Auto“ für ein zweites baugleiches Exemplar statt „das gleiche Auto“.
- **false**: Begriffe werden ihrer genauen Bedeutung entsprechend verwendet und Bedeutungsunterschiede zwischen Wortpaaren werden beachtet.

## comparison_particles
Enthält die Zeile eine fehlerhafte Vergleichspartikel bei Ungleichheit oder Gleichheit?

### Criteria
- **true**: Die Partikel „wie“ wird fälschlich im Komparativ (Ungleichheit), „als“ im Positiv (Gleichheit) oder eine redundante Dopplung verwendet (z. B. „besser wie“ oder „besser als wie“ statt „besser als“; „genauso gut als“ statt „genauso gut wie“).
- **false**: „als“ wird korrekt für Ungleichheit/Komparativ und „wie“ für Gleichheit/Positiv verwendet.

## unnecessary_anglicisms
Enthält die Zeile einen unnötigen Anglizismus, für den ein geläufiges deutsches Äquivalent existiert?

### Criteria
- **true**: Ein englischer Ausdruck wird verwendet, obwohl ein treffendes und allgemein geläufiges deutsches Wort zur Verfügung steht (z. B. „Turnaround-Zeit“ statt „Lieferzeit“, „performen“ statt „leisten“ oder „abschneiden“).
- **false**: Anglizismen werden nur als etablierte Fachbegriffe oder feste Lehnwörter ohne natürliches deutsches Pendant eingesetzt.

## grammatical_agreement
Enthält die Zeile einen Grammatikfehler in der Kongruenz (Kasus, Genus, Numerus) oder Deklination?

### Criteria
- **true**: Ein grammatisches Übereinstimmungsmuster ist verletzt, wie falscher Artikel/Genus, fehlerhafte Kasusdeklination oder Nichtübereinstimmung von Subjekt und finitem Verb (z. B. „der Mädchen“ statt „das Mädchen“, „der Auto“ statt „das Auto“, „mit den neuen System“ statt „mit dem neuen System“, „wegen dem Wetter“ statt „wegen des Wetters“).
- **false**: Artikel, Pronomen, Adjektive, Nomen und Verben stimmen in Kasus, Genus und Numerus fehlerfrei überein.

## double_perfect
Enthält die Zeile die umgangssprachliche, standardsprachlich unzulässige Verdopplung des Perfekt-Hilfsverbs (doppeltes Perfekt)?

### Criteria
- **true**: Das Perfekt-Hilfsverb wird doppelt gesetzt (z. B. „Ich habe mein Buch vergessen gehabt“ statt „Ich habe mein Buch vergessen“ oder „Ich hatte mein Buch vergessen“; „Wir haben den Kurs gemacht gehabt“ statt „Wir haben den Kurs gemacht“).
- **false**: Es werden standardsprachliche Zeitformen (Perfekt, Präteritum, Plusquamperfekt) ohne Hilfsverb-Verdopplung verwendet.

## subordinate_verb_position
Steht das finite Verb in einem Nebensatz fälschlicherweise nicht an letzter Position?

### Criteria
- **true**: In einem mit einer unterordnenden Konjunktion (dass, weil, wenn, obwohl, damit, ob) oder einem Relativpronomen eingeleiteten Nebensatz steht das finite Verb nicht am Ende (z. B. „weil er hat keine Zeit“ statt „weil er keine Zeit hat“, „obwohl sie konnte nicht kommen“ statt „obwohl sie nicht kommen konnte“).
- **false**: Das finite Verb steht im Nebensatz regelgerecht an der letzten Satzgliedposition.

## negation_placement
Steht die Negationspartikel „nicht“ in einer unnatürlichen, bürokratischen Endstellung am Satzende?

### Criteria
- **true**: Das Wort „nicht“ steht unnatürlich weit vom Bezugsverb getrennt am Satzende (z. B. „haftet für den Schaden nicht“ statt „haftet nicht für den Schaden“).
- **false**: Die Verneinung ist natürlich beim finiten Verb oder beim negierten Satzteil platziert.

## comma_placement
Fehlt in der Zeile ein obligatorisches Komma zur Abtrennung eines Nebensatzes oder einer abhängigen Infinitivgruppe?

### Criteria
- **true**: Ein Nebensatz (vorangestellt, nachgestellt oder eingeschoben) oder eine abhängige Infinitivgruppe mit „zu“ (eingeleitet durch um, ohne, statt, anstatt, außer, als oder abhängig von einem Korrelat, Nomen oder Adjektiv) ist nicht durch Kommas abgetrennt (z. B. „Dass er ein Buch gekauft hat erzählt er vor Beginn“; „Sie freut sich darauf ihren Kurs zu beginnen“).
- **false**: Alle Nebensätze und regelpflichtigen Infinitivgruppen sind ordnungsgemäß durch Kommas abgetrennt.

## salutation_comma
Steht nach einer Gruß- oder Abschlussformel fälschlicherweise ein Komma?

### Criteria
- **true**: Ein Komma steht unzulässig zwischen der Abschlussformel und der Absenderzeile (z. B. „Mit freundlichen Grüßen,“ gefolgt von einem Namen).
- **false**: Gruß- und Abschlussformeln enden ohne nachgestelltes Komma.

## hyphen_and_dash
Werden Bindestrich und Gedankenstrich verwechselt oder mit falscher Länge/Abstand gesetzt?

### Criteria
- **true**: Ein Bindestrich (-) steht fälschlich anstelle eines Gedankenstrichs (–) bei Einschüben („Sie - die Schülerin - hat“), Bis-Angaben („2023-2025“) oder Cent-Beträgen; oder ein Gedankenstrich steht fälschlich bei Wortkopplungen („Deutsch–Kurs“).
- **false**: Bindestrich (-) und Halbgeviertstrich (–) werden ihrer Funktion und den Abstandsregeln entsprechend verwendet.

## quotation_marks
Werden typografisch falsche Anführungszeichen wie reine ASCII-Zollzeichen verwendet?

### Criteria
- **true**: Reine ASCII-Zollzeichen ("...") oder englische Anführungszeichen werden anstelle der typografischen deutschen Anführungszeichen („...“ mit 99 unten und 66 oben) für Zitate oder wörtliche Rede verwendet.
- **false**: Es werden korrekte typografische deutsche Anführungszeichen („...“) verwendet.
