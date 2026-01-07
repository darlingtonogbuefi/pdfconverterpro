# infra_core/ec2.tf

# infra_core/ec2.tf

# Use the latest Amazon Linux 2023 AMI
# Fetch the latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*"]
  }
}

# Create an AWS key pair from the project’s public key
resource "aws_key_pair" "ec2" {
  key_name   = var.key_name
  public_key = file("C:\\Users\\MAGNUM\\.ssh\\my-new-ec2-key.pub")
}

# API EC2 instance (in private subnet)
resource "aws_instance" "api" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.ec2.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.api_sg.id]
  subnet_id              = aws_subnet.private_1.id  # private subnet

  tags = {
    Name = "${var.project_name}-api-${var.environment}"
  }
}

# Worker EC2 instance (in private subnet)
resource "aws_instance" "worker" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.ec2.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.worker_sg.id] # optional: create a separate SG
  subnet_id              = aws_subnet.private_2.id  # private subnet

  tags = {
    Name = "${var.project_name}-worker-${var.environment}"
  }
}
