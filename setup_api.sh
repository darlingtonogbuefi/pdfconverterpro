#!/bin/bash    
# setup_api.sh

set -euo pipefail

APP_USER="ubuntu"
APP_DIR="/home/ubuntu/pdfconverterpro"
VENV_DIR="$APP_DIR/venv"
REPO_URL="https://github.com/darlingtonogbuefi/pdfconverterpro.git"
SERVICE_NAME="pdfconverterpro-api"
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

# Safe default if JOBS__FILES_S3_BUCKET is not set
FILES_BUCKET="${JOBS__FILES_S3_BUCKET:-pdfconvertpro-files-prod}"
FRONTEND_BUCKET="${FRONTEND_S3_BUCKET:-pdfconvertpro-frontend-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "JOBS__FILES_S3_BUCKET=$FILES_BUCKET"
echo "FRONTEND_S3_BUCKET=$FRONTEND_BUCKET"
echo "AWS_REGION=$AWS_REGION"

# -----------------------------------
# System packages
# -----------------------------------
log_step "Installing system packages (Python, OCR, PDF tools)"
if apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    git \
    snapd \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    poppler-utils \
    ghostscript
then
    log_success "System packages installed"
else
    log_error "Failed to install system packages"
    exit 1
fi

# -----------------------------------
# Verify OCR / PDF tools
# -----------------------------------
log_step "Verifying OCR and PDF tooling availability"

if tesseract --version >/dev/null 2>&1; then
    log_success "Tesseract OCR is available"
else
    log_error "Tesseract OCR is NOT available"
fi

if pdftoppm -h >/dev/null 2>&1; then
    log_success "Poppler (pdftoppm) is available"
else
    log_error "Poppler is NOT available"
fi

if gs --version >/dev/null 2>&1; then
    log_success "Ghostscript is available"
else
    log_error "Ghostscript is NOT available"
fi

# -----------------------------------
# Clone or update repository
# -----------------------------------
log_step "Cloning or updating repository"

if [ -d "$APP_DIR" ]; then
    sudo chown -R $APP_USER:$APP_USER "$APP_DIR/.git"
    sudo chmod -R u+rwX "$APP_DIR/.git"
    sudo chown -R $APP_USER:$APP_USER "$APP_DIR"
fi

cd /home/ubuntu
if [ ! -d "$APP_DIR" ]; then
    echo "Cloning repository..."
    if sudo -u $APP_USER git clone "$REPO_URL" "$APP_DIR"; then
        log_success "Repository cloned"
    else
        log_error "Failed to clone repository"
        exit 1
    fi
else
    echo "Updating repository..."
    cd "$APP_DIR"
    if sudo -u $APP_USER git pull origin main; then
        log_success "Repository updated"
    else
        log_error "Failed to update repository"
        exit 1
    fi
fi

# -----------------------------------
# Python virtual environment
# -----------------------------------
log_step "Setting up Python virtual environment"
cd "$APP_DIR"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    if sudo -u $APP_USER python3 -m venv venv; then
        log_success "Virtual environment created"
    else
        log_error "Failed to create virtual environment"
        exit 1
    fi
fi

sudo -u $APP_USER mkdir -p /home/$APP_USER/.cache/pip
sudo chown -R $APP_USER:$APP_USER /home/$APP_USER/.cache

source "$VENV_DIR/bin/activate"

sudo -H -u $APP_USER "$VENV_DIR/bin/pip" install --upgrade pip wheel setuptools
sudo -H -u $APP_USER "$VENV_DIR/bin/pip" install -r requirements.txt uvicorn opencv-python camelot-py

log_success "Python dependencies including camelot and OpenCV installed"

deactivate

# -----------------------------------
# Environment file for systemd (overwrite with new vars)
# -----------------------------------
log_step "Writing environment file for systemd"

# Safe defaults for all other variables
DB_HOST="${DB_HOST:-}"
DB_PORT="${DB_PORT:-}"
DB_USER="${DB_USER:-}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-}"
SQS_QUEUE_URL="${SQS_QUEUE_URL:-}"
WORKER_HOST="${WORKER_HOST:-}"
API_HOST="${API_HOST:-}"
VITE_BACKEND_URL="${VITE_BACKEND_URL:-}"
NUTRIENT_API_KEY="${NUTRIENT_API_KEY:-}"
NUTRIENT_BASE_URL="${NUTRIENT_BASE_URL:-}"
NUTRIENT_SESSION_URL="${NUTRIENT_SESSION_URL:-}"
NUTRIENT_SIGN_URL="${NUTRIENT_SIGN_URL:-}"

cat > "$ENV_FILE" <<EOF
# S3 Buckets
JOBS__FILES_S3_BUCKET=$FILES_BUCKET
FRONTEND_S3_BUCKET=$FRONTEND_BUCKET
AWS_REGION=$AWS_REGION

# Database
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# SQS
SQS_QUEUE_URL=$SQS_QUEUE_URL

# Backend / Worker
WORKER_HOST=$WORKER_HOST
API_HOST=$API_HOST
VITE_BACKEND_URL=$VITE_BACKEND_URL

# Nutrient API
NUTRIENT_API_KEY=$NUTRIENT_API_KEY
NUTRIENT_BASE_URL=$NUTRIENT_BASE_URL
NUTRIENT_SESSION_URL=$NUTRIENT_SESSION_URL
NUTRIENT_SIGN_URL=$NUTRIENT_SIGN_URL
EOF

chmod 600 "$ENV_FILE"
log_success "Environment file overwritten at $ENV_FILE"

# -----------------------------------
# Create systemd service for API
# -----------------------------------
log_step "Creating systemd service for API"
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

chmod 644 "$SERVICE_FILE"
log_success "Systemd service file created at $SERVICE_FILE"

# -----------------------------------
# Enable & start service
# -----------------------------------
log_step "Enabling and starting API service"
if systemctl daemon-reload && systemctl enable "$SERVICE_NAME" && systemctl restart "$SERVICE_NAME"; then
    log_success "Service $SERVICE_NAME enabled and started"
else
    log_error "Failed to enable/start service $SERVICE_NAME"
    exit 1
fi

systemctl status "$SERVICE_NAME" --no-pager || echo "Could not retrieve service status"

# -----------------------------------
# AWS SSM Agent (Snap) - last
# -----------------------------------
log_step "Ensuring AWS SSM Agent is installed and running"
if ! snap list | grep -q amazon-ssm-agent; then
    echo "Installing AWS SSM Agent..."
    if snap install amazon-ssm-agent --classic; then
        log_success "AWS SSM Agent installed"
    else
        log_error "Failed to install AWS SSM Agent"
    fi
fi

if ! snap services | grep -q amazon-ssm-agent; then
    if snap enable amazon-ssm-agent; then
        log_success "SSM Agent enabled"
    else
        log_error "Failed to enable SSM Agent"
    fi
fi

if systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service && \
   systemctl restart snap.amazon-ssm-agent.amazon-ssm-agent.service
then
    log_success "SSM Agent service enabled and restarted"
else
    log_error "Failed to start SSM Agent service"
fi

log_step "API setup complete and running"
echo "JOBS__FILES_S3_BUCKET=$FILES_BUCKET"
echo "FRONTEND_S3_BUCKET=$FRONTEND_BUCKET"
