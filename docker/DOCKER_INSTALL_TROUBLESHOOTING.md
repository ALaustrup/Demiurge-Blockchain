# Docker Installation Troubleshooting Guide

## Common Issues

### 1. SSH Connection Failed

**Error:** `Permission denied (publickey)`

**Solutions:**
- Ensure SSH key is set up: `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_pleroma`
- Copy public key to server: `type ~/.ssh/id_ed25519_pleroma.pub | ssh pleroma@51.210.209.112 'mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys'`
- Use SSH config hostname: Add to `~/.ssh/config`:
  ```
  Host pleroma
      HostName 51.210.209.112
      User pleroma
      IdentityFile ~/.ssh/id_ed25519_pleroma
  ```

### 2. Ubuntu 25.10 Repository Not Found

**Error:** `E: Unable to locate package docker-ce` or repository 404

**Cause:** Ubuntu 25.10 may not be officially supported by Docker yet.

**Solution:** Use Ubuntu 24.04 (Noble) repository as fallback:

```bash
# On the server, edit the repository setup:
sudo bash -c 'echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  noble stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null'

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3. Docker Group Permission Issues

**Error:** `Got permission denied while trying to connect to the Docker daemon`

**Solutions:**
- Add user to docker group: `sudo usermod -aG docker $USER`
- Log out and log back in (or run `newgrp docker`)
- Verify: `groups` should show `docker` in the list

### 4. Installation Script Fails

**Error:** Script exits with error code

**Debug Steps:**
1. Run script with verbose output:
   ```bash
   sudo bash -x scripts/install-docker-monad.sh
   ```

2. Check system logs:
   ```bash
   journalctl -xe
   ```

3. Verify prerequisites:
   ```bash
   lsb_release -a  # Check Ubuntu version
   uname -a         # Check kernel version
   ```

### 5. Docker Compose Not Found

**Error:** `docker compose: command not found`

**Solution:** Install Docker Compose Plugin (not standalone):
```bash
sudo apt-get install -y docker-compose-plugin
```

Verify: `docker compose version` (note: `compose` not `compose`)

### 6. Manual Installation (If Script Fails)

If the automated script fails, install manually:

```bash
# 1. Update system
sudo apt-get update
sudo apt-get upgrade -y

# 2. Install prerequisites
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    apt-transport-https

# 3. Add Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 4. Add repository (use 'noble' for Ubuntu 25.10 compatibility)
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  noble stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Update and install
sudo apt-get update
sudo apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

# 6. Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# 7. Add user to docker group
sudo usermod -aG docker $USER

# 8. Verify (after logout/login)
docker --version
docker compose version
docker ps
```

## Verification Steps

After installation, verify everything works:

```bash
# 1. Check Docker version
docker --version

# 2. Check Docker Compose version
docker compose version

# 3. Test Docker daemon
docker info

# 4. Test running a container
docker run hello-world

# 5. Check user groups
groups | grep docker
```

## Getting Help

If issues persist:

1. Check Docker logs: `journalctl -u docker.service`
2. Check system resources: `free -h`, `df -h`
3. Verify network connectivity: `ping download.docker.com`
4. Review installation script output for specific error messages

---

**Last Updated:** January 2026  
**OS:** Ubuntu 25.10 (Wily Werewolf)
