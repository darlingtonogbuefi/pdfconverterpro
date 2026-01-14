# infra_core_terraform\ec2.tf

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
  # Root volume increased to 30 GB
  # ------------------------------
  root_block_device {
    volume_size           = 15
    volume_type           = "gp3"
    delete_on_termination = true
  }

  # ------------------------------
  # User data removed
  # ------------------------------
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
  # Root volume increased to 30 GB
  # ------------------------------
  root_block_device {
    volume_size           = 15
    volume_type           = "gp3"
    delete_on_termination = true
  }

  # ------------------------------
  # User data removed
  # ------------------------------
}
