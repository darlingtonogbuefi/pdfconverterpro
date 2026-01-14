#!/bin/bash
#     setup_worker.sh

set -euo pipefail

APP_USER="ubuntu"
APP_DIR="/home/ubuntu/pdfconverterpro"
VENV_DIR="$APP_DIR/venv"
REPO_URL="https://github.com/darlingtonogbuefi/pdfconverterpro.git"
SERVICE_NAME="pdfconverterpro-worker"
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
# LOG MANAGEMENT START (APPLY FIRST)
# -----------------------------------
log_step "Cleaning old logs and configuring journal/logrotate limits before deployment"

sudo rm -f /var/log/syslog /var/log/syslog.* /var/log/*.gz /var/log/*.[0-9] 2>/dev/null || true
sudo journalctl --vacuum-size=50M
sudo journalctl --vacuum-time=7d
log_success "Old logs cleaned"

sudo mkdir -p /etc/systemd/journald.conf.d
sudo tee /etc/systemd/journald.conf.d/limits.conf >/dev/null <<EOF
[Journal]
SystemMaxUse=50M
RuntimeMaxUse=50M
SystemKeepFree=100M
EOF

sudo systemctl daemon-reexec
sudo systemctl restart systemd-journald
log_success "systemd journal limits applied (SystemMaxUse=50M, RuntimeMaxUse=50M)"

sudo tee /etc/logrotate.d/syslog >/dev/null <<EOF
/var/log/syslog
{
    daily
    rotate 7
    size 50M
    compress
    missingok
    notifempty
    delaycompress
    copytruncate
    postrotate
        /usr/lib/rsyslog/rsyslog-rotate || true
    endscript
}
EOF

sudo logrotate -f /etc/logrotate.d/syslog
log_success "logrotate configured for /var/log/syslog (max 50MB, 7 rotations)"

# -----------------------------------
# REQUIRED ENV VARS
# -----------------------------------
log_step "Checking required environment variables"
if [ -z "${JOBS__FILES_S3_BUCKET:-}" ]; then
    log_error "JOBS__FILES_S3_BUCKET environment variable is not set"
    echo "Example: export JOBS__FILES_S3_BUCKET=pdfconvertpro-files-prod"
    exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
echo "JOBS__FILES_S3_BUCKET=$JOBS__FILES_S3_BUCKET"
echo "AWS_REGION=$AWS_REGION"

# -----------------------------------
# System packages (quiet + noninteractive)
# -----------------------------------
log_step "Installing system packages (Python, OCR, PDF tools)"
export DEBIAN_FRONTEND=noninteractive

apt-get update -qq >/dev/null 2>&1
if apt-get install -y -qq python3 python3-venv python3-pip git snapd libgl1 libglib2.0-0 \
    tesseract-ocr poppler-utils ghostscript >/dev/null 2>&1; then
    log_success "System packages installed"
    sudo snap set system refresh.retain=2
else
    log_error "Failed to install system packages"
    exit 1
fi

# -----------------------------------
# Verify OCR / PDF tools
# -----------------------------------
log_step "Verifying OCR and PDF tooling availability"

for tool in tesseract pdftoppm gs; do
    if command -v $tool >/dev/null 2>&1; then
        log_success "$tool is available"
    else
        log_error "$tool is NOT available"
        exit 1
    fi
done

# -----------------------------------
# Clone or update repository
# -----------------------------------
log_step "Cloning or updating repository"

if [ -d "$APP_DIR" ]; then
    sudo chown -R $APP_USER:$APP_USER "$APP_DIR"
fi

cd /home/ubuntu
if [ ! -d "$APP_DIR" ]; then
    sudo -u $APP_USER git clone "$REPO_URL" "$APP_DIR" >/dev/null 2>&1
    log_success "Repository cloned"
else
    cd "$APP_DIR"
    sudo -u $APP_USER git pull origin main >/dev/null 2>&1
    log_success "Repository updated"
fi

# -----------------------------------
# Python virtual environment
# -----------------------------------
log_step "Setting up Python virtual environment"
cd "$APP_DIR"
if [ ! -d "$VENV_DIR" ]; then
    sudo -u $APP_USER python3 -m venv venv >/dev/null 2>&1
    log_success "Virtual environment created"
fi

sudo -u $APP_USER mkdir -p /home/$APP_USER/.cache/pip
sudo chown -R $APP_USER:$APP_USER /home/$APP_USER/.cache

source "$VENV_DIR/bin/activate"
export PIP_USER=no

sudo -H -u $APP_USER "$VENV_DIR/bin/pip" install --upgrade --no-cache-dir pip wheel setuptools >/dev/null 2>&1
sudo -H -u $APP_USER "$VENV_DIR/bin/pip" install --upgrade --no-cache-dir -r requirements.txt uvicorn opencv-python camelot-py >/dev/null 2>&1
log_success "Python dependencies including camelot and OpenCV installed"
deactivate

# -----------------------------------
# Environment file for systemd
# -----------------------------------
log_step "Writing environment file for systemd"
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

# Backend / Worker
WORKER_HOST=${WORKER_HOST}
API_HOST=${API_HOST}
VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Nutrient API
NUTRIENT_API_KEY=${NUTRIENT_API_KEY}
NUTRIENT_BASE_URL=${NUTRIENT_BASE_URL}
NUTRIENT_SESSION_URL=${NUTRIENT_SESSION_URL}
NUTRIENT_SIGN_URL=${NUTRIENT_SIGN_URL}
EOF
chmod 600 "$ENV_FILE"
log_success "Environment file created at $ENV_FILE"

# -----------------------------------
# Create systemd service for Worker (quiet)
# -----------------------------------
log_step "Creating systemd service for Worker"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=PDF Converter Pro Worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$VENV_DIR/bin/python -m backend.worker
Restart=always
RestartSec=5
StandardOutput=null
StandardError=null
EnvironmentFile=$ENV_FILE

[Install]
WantedBy=multi-user.target
EOF
log_success "Systemd service file created at $SERVICE_FILE"

# -----------------------------------
# Enable & start service
# -----------------------------------
log_step "Enabling and starting Worker service"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME" >/dev/null 2>&1
systemctl restart "$SERVICE_NAME" >/dev/null 2>&1
log_success "Service $SERVICE_NAME enabled and started"

# -----------------------------------
# AWS SSM Agent (Snap)
# -----------------------------------
log_step "Ensuring AWS SSM Agent is installed and running"
if ! snap list | grep -q amazon-ssm-agent; then
    snap install amazon-ssm-agent --classic >/dev/null 2>&1
    log_success "AWS SSM Agent installed"
fi

snap enable amazon-ssm-agent >/dev/null 2>&1 || true
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service >/dev/null 2>&1
systemctl restart snap.amazon-ssm-agent.amazon-ssm-agent.service >/dev/null 2>&1
log_success "SSM Agent service enabled and restarted"

log_step "Worker setup complete and running"
echo "JOBS__FILES_S3_BUCKET=$JOBS__FILES_S3_BUCKET"
