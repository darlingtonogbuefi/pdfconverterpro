# infra_core/bastion.tf

# ============================
# Bastion Security Group
# ============================
resource "aws_security_group" "bastion_sg" {
  name   = "${var.project_name}-bastion-sg"
  vpc_id = aws_vpc.main.id

  # SSH access from laptop
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.laptop_ip_cidr]
  }

  # All outbound allowed
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-bastion-sg"
    Role        = "bastion"
    Environment = var.environment
  }
}

# ============================
# Bastion EC2 (Amazon Linux 2023)
# ============================
resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.ec2.key_name
  vpc_security_group_ids = [aws_security_group.bastion_sg.id]
  subnet_id              = aws_subnet.public_1.id
  # user_data removed, default Amazon Linux user will be used

  tags = {
    Name        = "${var.project_name}-bastion"
    Role        = "bastion"
    Environment = var.environment
  }

  monitoring              = true
  disable_api_termination = false
}
