# Windows-Installationsanleitung

Diese Anleitung hilft Ihnen, BetterBahn auf Windows mit Docker Desktop zu installieren und auszuführen. Wir erklären jeden Schritt im Detail, als ob Sie neu bei der Befehlszeile sind.

## Voraussetzungen

- Windows 10 oder neuer (64-Bit)
- Docker Desktop für Windows installiert. Sie können es von [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) herunterladen.
- Stellen Sie sicher, dass Docker Desktop läuft und für die Verwendung von Linux-Containern konfiguriert ist (Standard).

## Installationsschritte

1. **Eingabeaufforderung öffnen**:
   - Drücken Sie die Windows-Taste auf Ihrer Tastatur (normalerweise zwischen Strg und Alt).
   - Geben Sie "cmd" ein und drücken Sie Enter.
   - Ein schwarzes Fenster namens "Eingabeaufforderung" sollte sich öffnen. Hier geben Sie die Befehle ein.

2. **Docker Compose-Datei herunterladen**:
   - Im Eingabeaufforderungsfenster geben Sie den folgenden Befehl ein und drücken Enter:

     ```shell
     curl -o docker-compose.yaml https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml
     ```

     Dies lädt die Datei in Ihr aktuelles Verzeichnis herunter (normalerweise Ihr Benutzerordner).
   - Falls curl nicht funktioniert, können Sie sie manuell herunterladen:
     - Öffnen Sie Ihren Webbrowser und gehen Sie zu [https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml](https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml).
     - Rechtsklicken Sie auf die Seite und wählen Sie "Speichern unter...", um die Datei als `docker-compose.yaml` in einem leicht zu findenden Ordner zu speichern, z.B. Desktop oder Dokumente.

3. **In den Ordner navigieren (falls manuell heruntergeladen)**:
   - Falls Sie die Datei in einen bestimmten Ordner heruntergeladen haben, müssen Sie in der Eingabeaufforderung dorthin gehen.
   - Zum Beispiel, falls sie auf Ihrem Desktop ist, geben Sie ein:

     ```shell
     cd Desktop
     ```

     und drücken Enter.
   - Um zu sehen, was im aktuellen Ordner ist, geben Sie `dir` ein und drücken Enter.

4. **Anwendung ausführen**:
   - In der Eingabeaufforderung geben Sie ein:

     ```shell
     docker compose up -d
     ```

     und drücken Enter.
   - Dieser Befehl lädt das erforderliche Docker-Image herunter und startet die Anwendung im Hintergrund. Beim ersten Mal kann es einige Minuten dauern.

5. **Anwendung aufrufen**:
   - Öffnen Sie Ihren Webbrowser (z.B. Chrome, Edge oder Firefox).
   - Geben Sie in die Adressleiste [http://localhost:3000](http://localhost:3000) ein und drücken Enter.
   - Die BetterBahn-Anwendung sollte laden.

6. **Anwendung stoppen (falls erforderlich)**:
   - Um die Anwendung zu stoppen, gehen Sie zurück zur Eingabeaufforderung und geben ein:

     ```shell
     docker compose down
     ```

     und drücken Enter.

## Fehlerbehebung

- Falls Sie Probleme mit Docker haben, stellen Sie sicher, dass Docker Desktop läuft und dass die Virtualisierung in Ihrem BIOS aktiviert ist.
- Bei Windows Home Edition müssen Sie möglicherweise WSL2 aktivieren. Folgen Sie den Anweisungen auf der Docker Desktop-Website.
- Falls Port 3000 bereits verwendet wird, können Sie die Port-Zuordnung in der `docker-compose.yaml`-Datei ändern.
- Falls ein Befehl nicht funktioniert, stellen Sie sicher, dass Sie ihn genau so eingeben, wie gezeigt, inklusive Leerzeichen.
- Um die Eingabeaufforderung zu schließen, geben Sie `exit` ein und drücken Enter.
