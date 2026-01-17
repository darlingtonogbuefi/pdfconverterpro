#!/bin/bash
# setup_api_server1.sh

set -euo pipefail

APP_USER="ubuntu"
APP_DIR="/home/ubuntu/pdfconverterpro"
VENV_DIR="$APP_DIR/venv"
REPO_URL="https://github.com/darlingtonogbuefi/pdfconverterpro.git"
SERVICE_NAME="api_server1"
ENV_FILE="/etc/default/$SERVICE_NAME"

# -------------------------
# Helper functions
# -------------------------
log_step() {
    echo "=============================="
    echo " STEP: $1"
    echo "=============================="
}

log_success() {
    echo "SUCCESS: $1"
}

log_error() {
    echo "ERROR: $1"
}

# -----------------------------------
# REQUIRED ENV VARS
# -----------------------------------
log_step "Checking required environment variables"
if [ -z "${JOBS__FILES_S3_BUCKET:-}" ]; then
    log_error "JOBS__FILES_S3_BUCKET environment variable is not set"
    exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

echo "JOBS__FILES_S3_BUCKET=$JOBS__FILES_S3_BUCKET"
echo "AWS_REGION=$AWS_REGION"

# -----------------------------------
# System packages
# -----------------------------------
log_step "Installing system packages (Python, OCR, PDF tools)"
apt-get update
apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    git \
    fonts-dejavu-core \
    snapd \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    poppler-utils \
    ghostscript \
    react-pdf \
    pdfjs-dist

snap set system refresh.retain=2
log_success "System packages installed"

# -----------------------------------
# LOG MANAGEMENT START
# -----------------------------------
log_step "Configuring log rotation and journal limits"

sudo chown root:root /var/log
sudo chmod 755 /var/log
sudo chown root:adm /var/log/syslog || true
sudo chmod 640 /var/log/syslog || true

sudo mkdir -p /etc/systemd/journald.conf.d
sudo tee /etc/systemd/journald.conf.d/limits.conf >/dev/null <<EOF
[Journal]
SystemMaxUse=200M
RuntimeMaxUse=100M
EOF

sudo systemctl daemon-reexec
sudo systemctl restart systemd-journald
log_success "systemd journal limits applied"

sudo tee /etc/logrotate.d/syslog >/dev/null <<EOF
/var/log/syslog
{
    su root adm
    daily
    rotate 7
    size 100M
    compress
    missingok
    notifempty
    delaycompress
    postrotate
        /usr/lib/rsyslog/rsyslog-rotate || true
    endscript
}
EOF

sudo logrotate -f /etc/logrotate.d/syslog
log_success "logrotate configured safely"

sudo journalctl --vacuum-size=200M
sudo journalctl --vacuum-time=7d
sudo rm -f /var/log/*.gz /var/log/*.[0-9] 2>/dev/null || true
log_success "Old logs cleaned up"

# -----------------------------------
# Verify OCR / PDF tools
# -----------------------------------
log_step "Verifying OCR / PDF tools"
tesseract --version >/dev/null && log_success "Tesseract OK"
pdftoppm -h >/dev/null && log_success "Poppler OK"
gs --version >/dev/null && log_success "Ghostscript OK"

# -----------------------------------
# Clone or update repository
# -----------------------------------
log_step "Cloning or updating repository"

if [ -d "$APP_DIR" ]; then
    sudo chown -R $APP_USER:$APP_USER "$APP_DIR"
fi

cd /home/ubuntu
if [ ! -d "$APP_DIR" ]; then
    sudo -u $APP_USER git clone "$REPO_URL" "$APP_DIR"
else
    cd "$APP_DIR"
    sudo -u $APP_USER git pull origin main
fi

# -----------------------------------
# Python virtual environment
# -----------------------------------
log_step "Setting up Python virtual environment"
cd "$APP_DIR"

if [ ! -d "$VENV_DIR" ]; then
    sudo -u $APP_USER python3 -m venv venv
fi

sudo -u $APP_USER mkdir -p /home/$APP_USER/.cache/pip
sudo chown -R $APP_USER:$APP_USER /home/$APP_USER/.cache

sudo -H -u $APP_USER "$VENV_DIR/bin/pip" install --upgrade pip wheel setuptools
sudo -H -u $APP_USER "$VENV_DIR/bin/pip" install -r requirements.txt uvicorn opencv-python camelot-py

log_success "Python dependencies installed"

# -----------------------------------
# Environment file
# -----------------------------------
log_step "Writing environment file"

cat > "$ENV_FILE" <<EOF
# S3 Buckets
JOBS__FILES_S3_BUCKET=${JOBS__FILES_S3_BUCKET}
FRONTEND_S3_BUCKET=${FRONTEND_S3_BUCKET}

# Database
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# SQS
SQS_QUEUE_URL=${SQS_QUEUE_URL}
FRONTEND_SQS_QUEUE_URL=${FRONTEND_SQS_QUEUE_URL}
SQS_DLQ_URL=${SQS_DLQ_URL}

# Backend / API Servers
API_SERVER2_HOST=${API_SERVER2_HOST}
API_SERVER1_HOST=${API_SERVER1_HOST}
VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Nutrient API
NUTRIENT_API_KEY=${NUTRIENT_API_KEY}
NUTRIENT_BASE_URL=${NUTRIENT_BASE_URL}
NUTRIENT_SESSION_URL=${NUTRIENT_SESSION_URL}
NUTRIENT_SIGN_URL=${NUTRIENT_SIGN_URL}
EOF

chmod 600 "$ENV_FILE"
log_success "Environment file created"

# -----------------------------------
# systemd service
# -----------------------------------
log_step "Creating systemd service"

SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=PDF Converter Pro API Server 1
After=network-online.target
Wants=network-online.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$VENV_DIR/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always
EnvironmentFile=$ENV_FILE

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

log_success "API service running as $SERVICE_NAME"
