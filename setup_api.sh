#!/bin/bash
# setup_api.sh

set -e

APP_USER="ubuntu"
APP_DIR="/home/ubuntu/pdfconverterpro"
VENV_DIR="$APP_DIR/venv"
REPO_URL="https://github.com/darlingtonogbuefi/pdfconverterpro.git"
SERVICE_NAME="pdfconverterpro-api"
ENV_FILE="/etc/default/$SERVICE_NAME"

# -----------------------------------
# REQUIRED ENV VARS
# -----------------------------------
if [ -z "$FILES_BUCKET" ]; then
    echo "ERROR: FILES_BUCKET environment variable is not set"
    echo "Example:"
    echo "    export FILES_BUCKET=pdfconvertpro-files-prod"
    exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

echo "=============================="
echo " Setting up API service"
echo " FILES_BUCKET=$FILES_BUCKET"
echo " AWS_REGION=$AWS_REGION"
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
# Environment file for systemd
# -----------------------------------
cat > "$ENV_FILE" <<EOF
FILES_BUCKET=$FILES_BUCKET
AWS_REGION=$AWS_REGION
EOF

chmod 600 "$ENV_FILE"

# -----------------------------------
# Create systemd service for API
# -----------------------------------
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=PDF Converter Pro API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$VENV_DIR/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
EnvironmentFile=$ENV_FILE

[Install]
WantedBy=multi-user.target
EOF

# -----------------------------------
# Enable & start service
# -----------------------------------
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl status "$SERVICE_NAME" --no-pager

# -----------------------------------
# AWS SSM Agent (Snap) - last
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
echo " API setup complete and running"
echo " FILES_BUCKET=$FILES_BUCKET"
echo "=============================="
