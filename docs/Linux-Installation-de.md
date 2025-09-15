# Linux-Installationsanleitung

Diese Anleitung hilft Ihnen, BetterBahn auf Linux mit Docker zu installieren und auszuführen. Wir erklären jeden Schritt im Detail, als ob Sie neu bei der Befehlszeile sind.

## Voraussetzungen

- Eine Linux-Distribution (Ubuntu, Fedora, etc.)
- Docker auf Ihrem System installiert. Falls nicht, folgen Sie den Anweisungen unter [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/) für Ihre Distribution.
- Docker Compose (normalerweise mit Docker enthalten, oder separat installieren falls nötig).
- Stellen Sie sicher, dass Docker läuft: Öffnen Sie ein Terminal und führen Sie `sudo systemctl start docker` aus (falls systemd verwendet wird).

## Installationsschritte

1. **Ein Terminal öffnen**:
   - Drücken Sie Strg+Alt+T (auf den meisten Linux-Distributionen), um ein Terminalfenster zu öffnen.
   - Falls das nicht funktioniert, suchen Sie nach "Terminal" in Ihrem Anwendungsmenü.

2. **Docker Compose-Datei herunterladen**:
   - Im Terminal geben Sie den folgenden Befehl ein und drücken Enter:
     ```
     curl -o docker-compose.yaml https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml
     ```
     Dies lädt die Datei in Ihr aktuelles Verzeichnis herunter (normalerweise Ihr Home-Ordner).
   - Falls curl nicht installiert ist, können Sie es mit `sudo apt install curl` (auf Ubuntu/Debian) oder entsprechend für Ihre Distribution installieren.
   - Alternativ manuell herunterladen:
     - Öffnen Sie Ihren Webbrowser und gehen Sie zu [https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml](https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml).
     - Rechtsklicken Sie auf die Seite und wählen Sie "Link speichern unter...", um die Datei als `docker-compose.yaml` in einem leicht zu findenden Ordner zu speichern, z.B. Downloads oder Desktop.

3. **In den Ordner navigieren (falls manuell heruntergeladen)**:
   - Falls Sie die Datei in einen bestimmten Ordner heruntergeladen haben, müssen Sie in der Eingabeaufforderung dorthin gehen.
   - Zum Beispiel, falls sie in Ihrem Downloads-Ordner ist, geben Sie ein:
     ```
     cd Downloads
     ```
     und drücken Enter.
   - Um zu sehen, was im aktuellen Ordner ist, geben Sie `ls` ein und drücken Enter.

4. **Anwendung ausführen**:
   - Im Terminal geben Sie ein:
     ```
     docker compose up -d
     ```
     und drücken Enter.
   - Möglicherweise müssen Sie es mit sudo ausführen: `sudo docker compose up -d`
   - Dieser Befehl lädt das erforderliche Docker-Image herunter und startet die Anwendung im Hintergrund. Beim ersten Mal kann es einige Minuten dauern.

5. **Anwendung aufrufen**:
   - Öffnen Sie Ihren Webbrowser (z.B. Firefox oder Chrome).
   - Geben Sie in die Adressleiste [http://localhost:3000](http://localhost:3000) ein und drücken Enter.
   - Die BetterBahn-Anwendung sollte laden.

6. **Anwendung stoppen (falls erforderlich)**:
   - Um die Anwendung zu stoppen, gehen Sie zurück zum Terminal und geben ein:
     ```
     docker compose down
     ```
     (oder `sudo docker compose down`)
     und drücken Enter.

## Fehlerbehebung

- Falls Sie Berechtigungsfehler erhalten, versuchen Sie die Befehle mit `sudo` auszuführen.
- Falls Docker nicht läuft, starten Sie es mit `sudo systemctl start docker` (auf Systemen mit systemd).
- Falls Port 3000 bereits verwendet wird, können Sie die Port-Zuordnung in der `docker-compose.yaml`-Datei ändern.
- Falls ein Befehl nicht funktioniert, stellen Sie sicher, dass Sie ihn genau so eingeben, wie gezeigt, inklusive Leerzeichen.
- Um das Terminal zu schließen, geben Sie `exit` ein und drücken Enter.
