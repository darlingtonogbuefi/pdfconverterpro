#!/bin/bash 
# setup_worker.sh

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
# REQUIRED ENV VARS
# -----------------------------------
log_step "Checking required environment variables"
if [ -z "${FILES_BUCKET:-}" ]; then
    log_error "FILES_BUCKET environment variable is not set"
    echo "Example: export FILES_BUCKET=pdfconvertpro-files-prod"
    exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

echo "FILES_BUCKET=$FILES_BUCKET"
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
    exit 1
fi

if pdftoppm -h >/dev/null 2>&1; then
    log_success "Poppler (pdftoppm) is available"
else
    log_error "Poppler is NOT available"
    exit 1
fi

if gs --version >/dev/null 2>&1; then
    log_success "Ghostscript is available"
else
    log_error "Ghostscript is NOT available"
    exit 1
fi

# -----------------------------------
# Clone or update repository
# -----------------------------------
log_step "Cloning or updating repository"

# Step 0: Fix Git folder permissions if repo exists
if [ -d "$APP_DIR" ]; then
    sudo chown -R $APP_USER:$APP_USER "$APP_DIR/.git"
    sudo chmod -R u+rwX "$APP_DIR/.git"

    # Ensure entire app directory is owned by the app user
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

# Fix pip cache permissions
sudo -u $APP_USER mkdir -p /home/$APP_USER/.cache/pip
sudo chown -R $APP_USER:$APP_USER /home/$APP_USER/.cache

# Activate venv and install Python packages
source "$VENV_DIR/bin/activate"

if pip install --upgrade pip && pip install -r requirements.txt; then
    log_success "Python dependencies installed"
else
    log_error "Failed to install Python dependencies"
    deactivate
    exit 1
fi

# Explicitly install camelot-py[cv] to ensure OpenCV extras
if pip install "camelot-py[cv]"; then
    log_success "camelot-py[cv] installed successfully"
else
    log_error "Failed to install camelot-py[cv]"
    deactivate
    exit 1
fi

deactivate

# -----------------------------------
# Environment file for systemd
# -----------------------------------
log_step "Writing environment file for systemd"
if cat > "$ENV_FILE" <<EOF
FILES_BUCKET=$FILES_BUCKET
AWS_REGION=$AWS_REGION
EOF
then
    chmod 600 "$ENV_FILE"
    log_success "Environment file created at $ENV_FILE"
else
    log_error "Failed to create environment file"
    exit 1
fi

# -----------------------------------
# Create systemd service for Worker
# -----------------------------------
log_step "Creating systemd service for Worker"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

if cat > "$SERVICE_FILE" <<EOF
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
StandardOutput=journal
StandardError=journal
EnvironmentFile=$ENV_FILE

[Install]
WantedBy=multi-user.target
EOF
then
    log_success "Systemd service file created at $SERVICE_FILE"
else
    log_error "Failed to create systemd service file"
    exit 1
fi

# -----------------------------------
# Enable & start service
# -----------------------------------
log_step "Enabling and starting Worker service"
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

log_step "Worker setup complete and running"
echo "FILES_BUCKET=$FILES_BUCKET"
