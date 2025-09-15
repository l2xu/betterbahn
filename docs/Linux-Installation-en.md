# Linux Installation Guide

This guide will help you install and run BetterBahn on Linux using Docker. We'll explain every step in detail, assuming you're new to using the command line.

## Prerequisites

- A Linux distribution (Ubuntu, Fedora, etc.)
- Docker installed on your system. If not, follow the instructions at [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/) for your distribution.
- Docker Compose (usually included with Docker, or install separately if needed).
- Ensure Docker is running: Open a terminal and run `sudo systemctl start docker` (if using systemd).

## Installation Steps

1. **Open a Terminal**:
   - Press Ctrl+Alt+T (on most Linux distributions) to open a terminal window.
   - If that doesn't work, look for "Terminal" in your applications menu.

2. **Download the Docker Compose File**:
   - In the terminal, type the following command and press Enter:
     ```
     curl -o docker-compose.yaml https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml
     ```
     This will download the file to your current directory (usually your home folder).
   - If curl is not installed, you can install it with `sudo apt install curl` (on Ubuntu/Debian) or equivalent for your distribution.
   - Alternatively, download it manually:
     - Open your web browser and go to [https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml](https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml).
     - Right-click on the page and select "Save Link As..." to save the file as `docker-compose.yaml` in a folder you can easily find, like your Downloads or Desktop.

3. **Navigate to the Folder (if downloaded manually)**:
   - If you downloaded the file to a specific folder, you need to go to that folder in the terminal.
   - For example, if it's in your Downloads folder, type:
     ```
     cd Downloads
     ```
     and press Enter.
   - To see what's in the current folder, type `ls` and press Enter.

4. **Run the Application**:
   - In the terminal, type:
     ```
     docker compose up -d
     ```
     and press Enter.
   - You might need to run it with sudo: `sudo docker compose up -d`
   - This command will pull the necessary Docker image and start the application in the background. It might take a few minutes the first time.

5. **Access the Application**:
   - Open your web browser (like Firefox or Chrome).
   - In the address bar, type [http://localhost:3000](http://localhost:3000) and press Enter.
   - The BetterBahn application should load.

6. **Stop the Application (when needed)**:
   - To stop the application, go back to the terminal and type:
     ```
     docker compose down
     ```
     (or `sudo docker compose down`)
     and press Enter.

## Troubleshooting

- If you get permission errors, try running the commands with `sudo`.
- If Docker is not running, start it with `sudo systemctl start docker` (on systems with systemd).
- If port 3000 is already in use, you can change the port mapping in the `docker-compose.yaml` file.
- If a command doesn't work, make sure you're typing it exactly as shown, including spaces.
- To close the terminal, type `exit` and press Enter.
