# Join

Join ist eine webbasierte Kanban-Board-Anwendung für die Organisation von Aufgaben, Kontakten und Team-Workflows. Das Projekt bietet eine komplette Task-Management-Oberfläche mit Login, Gästebereich, Aufgabenverwaltung, Drag-and-Drop-Board, Kontaktverwaltung und einer Übersichtsdashboard-Seite. Die Anwendung nutzt Firebase Authentication für die Anmeldung und Firebase Realtime Database für die Speicherung von Aufgaben und Kontakten. fileciteturn0file0 fileciteturn0file1 fileciteturn0file20

## Features

- **Authentifizierung** mit E-Mail/Passwort und Gast-Login über Firebase Auth. Nach erfolgreichem Login werden Benutzer auf den internen Mitgliederbereich weitergeleitet. fileciteturn0file1
- **Geschützte Member-Seiten** durch Auth-Guards, damit interne Seiten nur für angemeldete Nutzer verfügbar sind. fileciteturn0file2 fileciteturn0file3
- **Summary-Dashboard** mit Kennzahlen zu To-do-, In-Progress-, Done-, Await-Feedback- und Urgent-Tasks sowie einer dynamischen Begrüßung. fileciteturn0file5
- **Kanban-Board** mit den Statusspalten `todo`, `in-progress`, `await-feedback` und `done`. Aufgaben können per Drag-and-Drop zwischen den Spalten verschoben werden. fileciteturn0file12
- **Aufgabenverwaltung** mit Erstellen, Bearbeiten und Löschen von Tasks inklusive Priorität, Kategorie, Fälligkeitsdatum, Assignees und Subtasks. fileciteturn0file7 fileciteturn0file10 fileciteturn0file50
- **Subtask-Management** zum Anlegen, Bearbeiten, Löschen und Abhaken von Unteraufgaben. fileciteturn0file8 fileciteturn0file7
- **Kontaktverwaltung** mit Anlegen, Bearbeiten, Löschen und Detailansicht von Kontakten. fileciteturn0file4 fileciteturn0file9
- **Assignee-Auswahl** für Aufgaben über ein Dropdown mit Kontaktliste und Avatar-Anzeige. fileciteturn0file6
- **Responsive UI-Komponenten** für öffentliche und geschützte Bereiche, inklusive mobiler Footer- und Overlay-Lösungen. fileciteturn0file11 fileciteturn0file13 fileciteturn0file14 fileciteturn0file15

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (ES Modules)
- **Backend / BaaS:** Firebase Authentication, Firebase Realtime Database
- **Hosting-kompatibel:** Statisches Frontend mit Firebase-Anbindung

Die Firebase-Konfiguration sowie der Zugriff auf Authentifizierung und Datenbank werden zentral in `firebase.js` initialisiert und exportiert. fileciteturn0file20

## Projektstruktur

```text
join/
├── index.html
├── member/
│   ├── js/
│   │   ├── board.js
│   │   ├── add-task.js
│   │   ├── add-task-assignees.js
│   │   ├── add-task-subtasks.js
│   │   ├── contacts.js
│   │   ├── contacts-render.js
│   │   ├── member-script.js
│   │   ├── member-templates.js
│   │   └── summary.js
├── public/
│   └── js/
│       ├── login.js
│       ├── signup.js
│       ├── public-script.js
│       └── public-templates.js
└── scripts/
    └── firebase/
        ├── firebase.js
        ├── get-firebase.js
        ├── push-task.js
        └── push-contact.js
```

## Zentrale Funktionen

### Login und Registrierung
Benutzer können sich per E-Mail und Passwort anmelden oder als Gast fortfahren. Zusätzlich unterstützt das Projekt eine Registrierung, bei der nach erfolgreicher Kontoerstellung auch ein Kontakt-Datensatz gespeichert wird. fileciteturn0file1 fileciteturn0file45 fileciteturn0file47

### Aufgabenmanagement
Neue Aufgaben enthalten Titel, Beschreibung, Due Date, Priorität, Kategorie, Assignees, Subtasks und Status. Beim Bearbeiten können bestehende Subtasks und Zuweisungen aktualisiert werden. Das Speichern erfolgt in Firebase. fileciteturn0file10 fileciteturn0file7 fileciteturn0file50

### Board und Workflow
Das Board rendert Aufgaben nach Status, zeigt Fortschritt für Subtasks an und unterstützt eine Suche über Task-Inhalte. Statusänderungen per Drag-and-Drop werden direkt in Firebase synchronisiert. fileciteturn0file12

### Kontakte
Kontakte werden aus Firebase geladen, alphabetisch gruppiert dargestellt und können in Overlays hinzugefügt oder bearbeitet werden. Kontakte werden außerdem für die Aufgaben-Zuweisung verwendet. fileciteturn0file4 fileciteturn0file9 fileciteturn0file46

## Voraussetzungen

- Ein Firebase-Projekt mit aktivierter **Authentication**
- Eine **Realtime Database** in Firebase
- Eine lokale Entwicklungsumgebung oder ein statischer Webserver

## Einrichtung

1. Repository klonen.
2. Projekt lokal öffnen.
3. Firebase-Projekt anlegen oder bestehende Konfiguration verwenden.
4. Firebase-Konfiguration in `scripts/firebase/firebase.js` prüfen oder anpassen.
5. Anwendung über einen lokalen Server starten.

## Beispiel für gespeicherte Task-Daten

```json
{
  "title": "Implement board search",
  "description": "Add search support for kanban tasks",
  "due_date": "2026-05-10",
  "priority": "medium",
  "assigned_to": {
    "0": "Alex Example",
    "1": "Sam Example"
  },
  "category": "technical-task",
  "subtasks": {
    "Subtask1": {
      "status": false,
      "title": "Create search input"
    }
  },
  "status": "todo",
  "createdAt": "2026-04-23T12:00:00.000Z"
}
```

Die Struktur orientiert sich an der Task-Erstellung im Projektcode. fileciteturn0file10

## Hinweise

- Einige Kommentare und Meldungen im Projekt sind noch gemischt auf Deutsch und Englisch.
- Es gibt bereits einzelne `FIXME`- und `CHECK`-Hinweise im Code, die auf mögliche Refactorings oder UI-Anpassungen hinweisen. fileciteturn0file11 fileciteturn0file15
- Die aktuelle README-Basis beschreibt Join nur sehr kurz als „business kanbanborad application“ und wurde hier zu einer vollständigen Projektbeschreibung erweitert. fileciteturn0file0

## Weiterentwicklung

Sinnvolle nächste Schritte für das Projekt wären:

- bessere Fehlerbehandlung und konsistente Nutzerhinweise
- Bereinigung von Namensinkonsistenzen im Code
- Trennung von UI-, Daten- und Zustandslogik
- Tests für Kernfunktionen wie Auth, Board-Statuswechsel und Formularvalidierung
- Bereinigung sensibler Konfigurationswerte für produktive Deployments

## Lizenz

Noch keine Lizenz angegeben.
