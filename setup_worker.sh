#!/bin/bash
set -e

APP_USER="ubuntu"
APP_DIR="/home/ubuntu/pdfconverterpro"
VENV_DIR="$APP_DIR/venv"
REPO_URL="https://github.com/darlingtonogbuefi/pdfconverterpro.git"
SERVICE_NAME="pdfconverterpro-worker"

echo "=============================="
echo " Setting up Worker service"
echo "=============================="

# -----------------------------------
# System packages
# -----------------------------------
apt-get update
apt-get install -y python3 python3-venv python3-pip git snapd libgl1 libglib2.0-0

# -----------------------------------
# Clone or update repository
# -----------------------------------
cd /home/ubuntu
if [ ! -d "$APP_DIR" ]; then
    echo "Cloning repository..."
    sudo -u $APP_USER git clone "$REPO_URL" "$APP_DIR"
else
    echo "Updating repository..."
    cd "$APP_DIR"
    sudo -u $APP_USER git pull origin main
fi

# -----------------------------------
# Python virtual environment
# -----------------------------------
cd "$APP_DIR"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    sudo -u $APP_USER python3 -m venv venv
fi

source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# -----------------------------------
# Create systemd service for Worker
# -----------------------------------
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=PDF Converter Pro Worker
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$VENV_DIR/bin/python -m backend.worker
Restart=always
RestartSec=5
Environment=PATH=$VENV_DIR/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl status "$SERVICE_NAME" --no-pager

# -----------------------------------
# AWS SSM Agent (Snap) – last
# -----------------------------------
if ! snap list | grep -q amazon-ssm-agent; then
    echo "Installing AWS SSM Agent..."
    snap install amazon-ssm-agent --classic
fi

if ! snap services | grep -q amazon-ssm-agent; then
    snap enable amazon-ssm-agent
fi

systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service
systemctl restart snap.amazon-ssm-agent.amazon-ssm-agent.service || true

echo "=============================="
echo " Worker setup complete and running"
echo "=============================="
