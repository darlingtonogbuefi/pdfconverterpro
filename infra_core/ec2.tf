# infra_core\ec2.tf

# ============================
# Amazon Linux AMI (Bastion)
# ============================
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ============================
# Ubuntu 22.04 LTS AMI (API + Worker)
# ============================
data "aws_ami" "ubuntu_lts" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ============================
# AWS Key Pair
# ============================
resource "aws_key_pair" "ec2" {
  key_name   = var.key_name
  public_key = file(var.ssh_public_key_path)
}

# ============================
# API EC2 (Ubuntu LTS)
# ============================
resource "aws_instance" "api" {
  ami                    = data.aws_ami.ubuntu_lts.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.ec2.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.api_sg.id]
  subnet_id              = aws_subnet.private_1.id

  tags = {
    Name        = "${var.project_name}-api-${var.environment}"
    Role        = "api"
    Environment = var.environment
  }

  monitoring              = true
  disable_api_termination = false

  # ------------------------------
  # User data: install SSM & bootstrap API repo
  # ------------------------------
  user_data = <<-EOF
              #!/bin/bash
              set -e

              # Install SSM agent via Snap
              sudo snap install amazon-ssm-agent --classic
              sudo snap enable amazon-ssm-agent
              sudo snap start amazon-ssm-agent

              # Optional: clone or update repo
              cd /home/ubuntu
              if [ ! -d pdfconverterpro ]; then
                  git clone ${var.pdfconverterpro_repo} pdfconverterpro
              else
                  cd pdfconverterpro
                  git pull origin main
              fi

              # Set up Python environment
              cd pdfconverterpro
              python3 -m venv venv || true
              source venv/bin/activate
              pip install --upgrade pip
              pip install -r requirements.txt

              # Start API service (systemd or fallback)
              sudo systemctl restart pdfconvertpro-api || nohup python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
              EOF
}

# ============================
# Worker EC2 (Ubuntu LTS)
# ============================
resource "aws_instance" "worker" {
  ami                    = data.aws_ami.ubuntu_lts.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.ec2.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.worker_sg.id]
  subnet_id              = aws_subnet.private_2.id

  tags = {
    Name        = "${var.project_name}-worker-${var.environment}"
    Role        = "worker"
    Environment = var.environment
  }

  monitoring              = true
  disable_api_termination = false

  # ------------------------------
  # User data: install SSM & bootstrap Worker repo
  # ------------------------------
  user_data = <<-EOF
              #!/bin/bash
              set -e

              # Install SSM agent via Snap
              sudo snap install amazon-ssm-agent --classic
              sudo snap enable amazon-ssm-agent
              sudo snap start amazon-ssm-agent

              # Optional: clone or update repo
              cd /home/ubuntu
              if [ ! -d pdfconverterpro ]; then
                  git clone ${var.pdfconverterpro_repo} pdfconverterpro
              else
                  cd pdfconverterpro
                  git pull origin main
              fi

              # Set up Python environment
              cd pdfconverterpro
              python3 -m venv venv || true
              source venv/bin/activate
              pip install --upgrade pip
              pip install -r requirements.txt

              # Start Worker service (systemd or fallback)
              sudo systemctl restart pdfconvertpro-worker || nohup python -m backend.worker --host 0.0.0.0 &
              EOF
}
