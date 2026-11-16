#!/usr/bin/env bash
set -e

echo "=========================================="
echo " DentalConnect Prerequisites Installer"
echo "=========================================="

echo ""
echo ">>> [1/4] Updating APT package lists..."
sudo apt update

echo ""
echo ">>> [2/4] Installing Python venv, pip, git & build essentials..."
sudo apt install -y python3-pip python3.12-venv git curl build-essential

echo ""
echo ">>> [3/4] Installing Node.js LTS (v20) and npm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js is already installed: $(node -v)"
fi

echo ""
echo ">>> [4/4] Installing Docker and Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo apt install -y docker.io docker-compose-v2
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER
    echo "Configured Docker service and added $USER to docker group."
else
    echo "Docker is already installed: $(docker --version)"
fi

echo ""
echo "=========================================="
echo " Verification:"
echo "------------------------------------------"
echo -n "Python:         " && python3 --version
echo -n "Python venv:    " && (python3 -m venv --help > /dev/null && echo "Ready")
echo -n "Node.js:        " && node -v
echo -n "npm:            " && npm -v
echo -n "Docker:         " && docker --version
echo -n "Docker Compose: " && docker compose version
echo "=========================================="
echo "All prerequisites installed successfully!"
echo "Note: If you were just added to the docker group,"
echo "run 'newgrp docker' or open a fresh terminal."
echo "=========================================="
