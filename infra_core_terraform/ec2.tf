# infra_core_terraform\ec2.tf

# infra_core_terraform\ec2.tf

# ============================
# Amazon Linux 2023 AMI (x86_64) for Bastion
# ============================
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}


# ============================
# Ubuntu 22.04 LTS AMI API servers
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
# API EC2 (Ubuntu LTS) - api_server1
# ============================
resource "aws_instance" "api_server1" {
  ami                    = data.aws_ami.ubuntu_lts.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.ec2.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.api_server1_sg.id]  # ✅ corrected
  subnet_id              = aws_subnet.private_1.id

  tags = {
    Name        = "api_server1"
    Role        = "api"
    Environment = var.environment
  }

  monitoring              = true
  disable_api_termination = false

  # ------------------------------
  # Root volume 
  # ------------------------------
  root_block_device {
    volume_size           = 15
    volume_type           = "gp3"
    delete_on_termination = true
  }
}

# ============================
# API EC2 (Ubuntu LTS) - api_server2
# ============================
resource "aws_instance" "api_server2" {
  ami                    = data.aws_ami.ubuntu_lts.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.ec2.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.api_server2_sg.id]  # ✅ corrected
  subnet_id              = aws_subnet.private_2.id

  tags = {
    Name        = "api_server2"
    Role        = "api"
    Environment = var.environment
  }

  monitoring              = true
  disable_api_termination = false

  # ------------------------------
  # Root volume 
  # ------------------------------
  root_block_device {
    volume_size           = 15
    volume_type           = "gp3"
    delete_on_termination = true
  }
}
