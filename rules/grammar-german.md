Deutsche Grammatik-, Rechtschreib- und Zeichensetzungsregeln: Rechtschreibung und verwechselte Wörter, Kongruenz und Formenlehre, Satzbau und Wortstellung sowie Zeichensetzung und Typografie.

# Line Rules

## spelling_and_confused_words
Enthält die Zeile einen Rechtschreibfehler, Tippfehler, ein fälschlich getrenntes Kompositum (Deppenleerzeichen), eine falsche Pluralform, ein verwechseltes Wortpaar, fehlerhafte Vergleichspartikeln oder einen unnötigen Anglizismus?

### Criteria
- **true**: Ein Wort ist orthografisch falsch geschrieben, ein Kompositum fälschlich mit Leerzeichen getrennt, ein Plural unzulässig gebildet, ein Wort mit ähnlicher Bedeutung verwechselt oder ein überflüssiger Anglizismus gewählt:
  - Tipp- und Rechtschreibfehler: z. B. „Vorraussetzung“ statt „Voraussetzung“, „das“ statt „dass“, „seit“ statt „seid“.
  - Verwechselte Wortpaare und Schein-Synonyme: „dasselbe“ (numerisch identischer Gegenstand) vs. „das gleiche“ (Gleichheit von Art, Typ oder Kopie) — z. B. „Er kaufte dasselbe Auto“ für ein zweites, baugleiches Exemplar statt „das gleiche Auto“.
  - Vergleichspartikeln „als“ und „wie“: „als“ für Ungleichheit/Unterschied im Komparativ, „wie“ für Gleichheit im Positiv; fehlerhafter Tausch oder Dopplung (z. B. „besser wie“ oder „besser als wie“ statt „besser als“; „genauso gut als“ statt „genauso gut wie“).
  - Falsche Pluralformen von Fremdwörtern und unregelmäßigen Nomen: z. B. „Risikos“ statt „Risiken“, „Atlasse“ statt „Atlanten“, „Kaktusse“ statt „Kakteen“, „Modusse“ statt „Modi“, „Museums“ statt „Museen“, „Virusse“ statt „Viren“.
  - Getrenntschreibung von Komposita (Deppenleerzeichen): z. B. „Projekt Manager“ statt „Projektmanager“ oder „Projekt-Manager“, „Qualitäts Kontrolle“ statt „Qualitätskontrolle“.
  - Unnötige Anglizismen mit geläufigem deutschen Äquivalent: z. B. „Turnaround-Zeit“ statt „Lieferzeit“, „performen“ statt „leisten/abschneiden“.
- **false**: Alle Wörter sind orthografisch korrekt geschrieben, Komposita regelgerecht zusammen- oder durchgekoppelt, Pluralformen korrekt, Bedeutungsunterschiede beachtet und Anglizismen nur als etablierte Fachbegriffe verwendet.

## grammatical_agreement_and_inflection
Enthält die Zeile einen Grammatikfehler in der Kongruenz (Kasus, Genus, Numerus), einen falschen Artikel, eine fehlerhafte Deklination oder eine unzulässige Zeitform (insbesondere das doppelte Perfekt)?

### Criteria
- **true**: Ein grammatisches Übereinstimmungs- oder Beugungsmuster ist verletzt:
  - Falscher Artikel oder Genus-Fehler: z. B. „der Mädchen“ statt „das Mädchen“, „der Auto“ statt „das Auto“.
  - Kasuskongruenz und Deklination: Artikel, Pronomen, Adjektiv und Substantiv stimmen im grammatischen Fall nicht überein (z. B. „mit den neuen System“ statt „mit dem neuen System“, „wegen dem Wetter“ statt „wegen des Wetters“).
  - Numerus-Kongruenz: Diskrepanz zwischen Subjekt und finitem Verb.
  - Doppeltes Perfekt: Umgangssprachliche, standardsprachlich unzulässige Verdopplung des Perfekt-Hilfsverbs (z. B. „Ich habe mein Buch vergessen gehabt“ statt „Ich habe mein Buch vergessen“ oder „Ich hatte mein Buch vergessen“; „Wir haben den Sprachkurs gemacht gehabt“ statt „Wir haben den Sprachkurs gemacht“).
- **false**: Alle Artikel, Pronomen, Adjektive und Nomen stimmen in Genus, Numerus und Kasus überein, und Verben nutzen standarddeutsche Zeitformen ohne Hilfsverb-Verdopplung.

## sentence_structure_and_word_order
Enthält die Zeile einen syntaktischen Fehler in der Satzstellung, insbesondere verletzte Verbendstellung im Nebensatz oder eine unnatürlich ans Satzende verschobene Negation?

### Criteria
- **true**: Die Satzgliedstellung verstößt gegen die Regeln der deutschen Syntax oder klingt bürokratisch unnatürlich:
  - Fehlende Verbendstellung im Nebensatz: In einem mit Konjunktion (dass, weil, wenn, obwohl, damit, ob etc.) oder Relativpronomen eingeleiteten Nebensatz steht das finite Verb nicht an letzter Position (z. B. „weil er hat keine Zeit“ statt „weil er keine Zeit hat“, „obwohl sie konnte nicht kommen“ statt „obwohl sie nicht kommen konnte“).
  - Bürokratische Negationsstellung: Die Negationspartikel „nicht“ steht unnatürlich weit vom Verb oder Bezugswort getrennt am Satzende (z. B. „haftet für den Schaden nicht“ statt „haftet nicht für den Schaden“).
- **false**: Das finite Verb steht im Nebensatz regelgerecht an letzter Stelle, und die Verneinung ist natürlich platziert.

## punctuation_and_typography
Enthält die Zeile einen Fehler in der Zeichensetzung oder Typografie — fehlende Kommas bei Nebensätzen oder Infinitivgruppen, ein überflüssiges Komma nach einer Grußformel, Verwechslung von Binde- und Gedankenstrich oder typografisch falsche Anführungszeichen?

### Criteria
- **true**: Ein Satzzeichen oder typografisches Zeichen ist fehlerhaft gesetzt oder ausgelassen:
  - Fehlendes Komma bei Nebensätzen: Ein Nebensatz ist nicht durch Kommas abgetrennt — unabhängig davon, ob er vorangestellt, nachgestellt oder mitten in den Hauptsatz eingeschoben ist (z. B. „Dass er ein Buch gekauft hat erzählt er vor Beginn“ statt „Dass er ein Buch gekauft hat, erzählt er...“; „Er erzählt dass er ein Buch gekauft hat vor Beginn“ statt „Er erzählt, dass er ein Buch gekauft hat, vor Beginn“).
  - Fehlendes Komma bei Infinitivgruppen: Ein Infinitiv mit „zu“ ist nicht durch Komma abgetrennt, wenn er mit „um“, „ohne“, „statt“, „anstatt“, „außer“ oder „als“ eingeleitet wird, von einem Korrelat abhängt (z. B. „Sie freut sich darauf ihren Kurs zu beginnen“ statt „...darauf, ihren Kurs...“) oder von einem Substantiv/Adjektiv abhängt (z. B. „sein Ziel fließend Deutsch zu sprechen“; „er ist stolz den Kurs bestanden zu haben“). *Ausnahme: Kein Komma bei reinem Hilfs- oder Modalverbgefüge mit sein, scheinen, haben, brauchen, pflegen, drohen, versprechen (z. B. „Die Lehrkraft schien krank zu sein“).*
  - Unzulässiges Komma nach Grußformel: Ein Komma steht fälschlich zwischen Abschlussformel und Absenderzeile (z. B. „Mit freundlichen Grüßen,“ statt „Mit freundlichen Grüßen“ gefolgt von Name).
  - Verwechslung von Bindestrich und Gedankenstrich: Falsche Strichlänge oder falscher Abstand — Bindestrich `-` gesetzt statt Gedankenstrich `–` (Halbgeviertstrich) bei Einschüben mit Leerzeichen („Sie – die Schülerin – hat...“), bei Bis-Angaben ohne Leerzeichen („2023–2025“) oder Cent-Beträgen („2,– €“); oder Gedankenstrich fälschlich bei Komposita und Wortkopplungen („Deutsch- und Englischkurs“, „E-Mail“, „blau-weiß“).
  - Falsche Anführungszeichen: Reine ASCII-Zollzeichen `""` oder obenstehende englische Anführungszeichen anstelle der typografischen deutschen Anführungszeichen „...“ (unten 99, oben 66) für wörtliche Rede und Zitate.
- **false**: Alle Kommas bei Nebensätzen und Infinitivgruppen sind korrekt gesetzt, Grußformeln sind kommalos, Binde- und Gedankenstriche werden ihrer Funktion gemäß verwendet und Anführungszeichen sind typografisch korrekt formatiert.
