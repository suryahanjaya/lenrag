# 🔧 Docker Desktop WSL Fix Guide

## Problem
Docker Desktop cannot start due to corrupted WSL (Windows Subsystem for Linux) distributions.

**Error Messages:**
- `input/output error` when building images
- `Wsl/Service/RegisterDistro/CreateVm/HCS_E_CONNECTION_TIMEOUT`
- `Wsl/Service/RegisterDistro/CreateVm/WSAENOTCONN`
- `Windows Subsystem for Linux has no installed distributions`

---

## ✅ Solution 1: Reset Docker Desktop (RECOMMENDED)

This is the fastest and safest solution:

### Steps:
1. **Open Docker Desktop**
   - You may see error messages - that's OK

2. **Go to Settings**
   - Click the ⚙️ (gear) icon in the top-right corner

3. **Navigate to Troubleshoot**
   - In the left sidebar, click **Troubleshoot**

4. **Reset to Factory Defaults**
   - Click **"Reset to factory defaults"**
   - Click **"Reset"** to confirm
   - **IMPORTANT:** This will delete all your Docker containers, images, and volumes

5. **Wait for Reset**
   - Docker Desktop will close and restart
   - This takes about 2-5 minutes
   - Docker will automatically reinstall WSL distributions

6. **Verify Docker is Working**
   ```powershell
   docker --version
   docker ps
   ```

---

## ✅ Solution 2: Reinstall Docker Desktop (If Solution 1 Fails)

### Steps:

1. **Uninstall Docker Desktop**
   ```powershell
   # Open PowerShell as Administrator
   winget uninstall Docker.DockerDesktop
   # OR use Windows Settings → Apps → Docker Desktop → Uninstall
   ```

2. **Clean Up WSL**
   ```powershell
   # Shutdown WSL
   wsl --shutdown
   
   # Unregister Docker WSL distributions (if they exist)
   wsl --unregister docker-desktop
   wsl --unregister docker-desktop-data
   ```

3. **Delete Docker Data** (Optional - only if you want a complete clean slate)
   ```powershell
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Docker" -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force "$env:APPDATA\Docker" -ErrorAction SilentlyContinue
   ```

4. **Restart Your Computer**
   - This ensures all WSL and Docker processes are fully stopped

5. **Download Latest Docker Desktop**
   - Visit: https://www.docker.com/products/docker-desktop/
   - Download the Windows installer

6. **Install Docker Desktop**
   - Run the installer
   - Make sure **"Use WSL 2 instead of Hyper-V"** is checked
   - Complete the installation

7. **Start Docker Desktop**
   - It will automatically set up WSL distributions
   - Wait for the Docker icon in system tray to turn green

8. **Verify Installation**
   ```powershell
   docker --version
   docker ps
   wsl --list --verbose
   # You should see: docker-desktop and docker-desktop-data
   ```

---

## ✅ Solution 3: Update WSL (Alternative)

Sometimes updating WSL itself can fix the issue:

```powershell
# Open PowerShell as Administrator
wsl --update
wsl --shutdown
# Then restart Docker Desktop
```

---

## 🚀 After Docker is Fixed - Deploy Your Application

Once Docker is working again, run:

### Windows (PowerShell):
```powershell
.\deploy-docker.ps1
```

### Or Manual:
```powershell
# Clean build
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check status
docker ps
docker-compose logs -f
```

---

## 📊 Verify Everything is Working

```powershell
# Check Docker
docker --version
docker ps

# Check WSL distributions
wsl --list --verbose
# Should show:
#   docker-desktop         Running
#   docker-desktop-data    Running

# Check your containers
docker-compose ps

# View logs
docker-compose logs -f backend
```

---

## ⚠️ Important Notes

1. **Factory Reset will delete:**
   - All Docker containers
   - All Docker images
   - All Docker volumes
   - Your ChromaDB data (if stored in Docker volumes)

2. **Backup Important Data:**
   - If you have important data in Docker volumes, back it up first
   - Your code in `c:\Users\ASUS ZENBOOK\Desktop\lenrag` is safe

3. **After Reset:**
   - You'll need to rebuild your images
   - You'll need to re-upload your documents to ChromaDB

---

## 🆘 Still Not Working?

If none of these solutions work:

1. **Check Windows Updates**
   - Make sure Windows is fully updated
   - WSL requires recent Windows updates

2. **Check Virtualization**
   ```powershell
   # Check if virtualization is enabled
   Get-ComputerInfo | Select-Object -Property "HyperV*"
   ```

3. **Reinstall WSL**
   ```powershell
   # As Administrator
   wsl --install
   wsl --set-default-version 2
   ```

4. **Contact Support**
   - Docker Desktop: https://docs.docker.com/desktop/troubleshoot/overview/
   - WSL Issues: https://github.com/microsoft/WSL/issues

---

**Last Updated**: 2025-12-15
**Issue**: WSL backend corruption preventing Docker Desktop from starting
