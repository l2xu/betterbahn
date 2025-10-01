# Windows Installation Guide

This guide will help you install and run BetterBahn on Windows using Docker Desktop. We'll explain every step in detail, assuming you're new to using the command line.

## Prerequisites

- Windows 10 or later (64-bit)
- Docker Desktop for Windows installed. You can download it from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop).
- Ensure Docker Desktop is running and configured to use Linux containers (default).

## Installation Steps

1. **Open Command Prompt**:
   - Press the Windows key on your keyboard (usually between Ctrl and Alt).
   - Type "cmd" and press Enter.
   - A black window called "Command Prompt" should open. This is where you'll type commands.

2. **Download the Docker Compose File**:
   - In the Command Prompt window, type the following command and press Enter:

     ```shell
     curl -o docker-compose.yaml https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml
     ```

     This will download the file to your current directory (usually your user folder).

   - If curl doesn't work, you can download it manually:
     - Open your web browser and go to [https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml](https://raw.githubusercontent.com/l2xu/betterbahn/main/docker-compose/docker-compose.yaml).
     - Right-click on the page and select "Save as..." to save the file as `docker-compose.yaml` in a folder you can easily find, like your Desktop or Documents.

3. **Navigate to the Folder (if downloaded manually)**:
   - If you downloaded the file to a specific folder, you need to go to that folder in Command Prompt.
   - For example, if it's on your Desktop, type:

     ```shell
     cd Desktop
     ```

     and press Enter.

   - To see what's in the current folder, type `dir` and press Enter.

4. **Run the Application**:
   - In the Command Prompt, type:

     ```shell
     docker compose up -d
     ```

     and press Enter.

   - This command will pull the necessary Docker image and start the application in the background. It might take a few minutes the first time.

5. **Access the Application**:
   - Open your web browser (like Chrome, Edge, or Firefox).
   - In the address bar, type [http://localhost:3000](http://localhost:3000) and press Enter.
   - The BetterBahn application should load.

6. **Stop the Application (when needed)**:
   - To stop the application, go back to the Command Prompt and type:

     ```shell
     docker compose down
     ```

     and press Enter.

## Troubleshooting

- If you encounter issues with Docker, ensure that Docker Desktop is running and that virtualization is enabled in your BIOS.
- For Windows Home edition, you might need to enable WSL2. Follow the instructions on the Docker Desktop website.
- If port 3000 is already in use, you can change the port mapping in the `docker-compose.yaml` file.
- If a command doesn't work, make sure you're typing it exactly as shown, including spaces.
- To close Command Prompt, type `exit` and press Enter.
