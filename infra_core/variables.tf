# infra_core/variables.tf

# infra_core/variables.tf

# ============================
# AWS region
# ============================
variable "aws_region" {
  description = "AWS region where all infrastructure resources will be created"
  type        = string
  default     = "us-east-1"
}

# ============================
# Project name
# ============================
variable "project_name" {
  description = "Base name of the project, used for naming AWS resources"
  type        = string
  default     = "pdfconvertpro"
}

# ============================
# Deployment environment
# ============================
variable "environment" {
  description = "Deployment environment name (e.g. dev, staging, prod)"
  type        = string
  default     = "prod"
}

# ============================
# EC2 instance type
# ============================
variable "instance_type" {
  description = "EC2 instance type used for application and worker instances"
  type        = string
  default     = "t3.medium"
}

# ============================
# EC2 key pair
# ============================
variable "key_name" {
  description = "Name of the AWS EC2 key pair used for SSH access"
  type        = string
  default     = "my-new-ec2-key"
}

# ============================
# RDS database credentials
# ============================
variable "db_user" {
  description = "Master username for the RDS database instance"
  type        = string
}

variable "db_password" {
  description = "Master password for the RDS database instance"
  type        = string
  sensitive   = true
}

# ============================
# Optional manual IP override (CIDR format)
# ============================
variable "my_ip" {
  description = "Optional manual override for laptop public IPv4 (in CIDR format). Comment out to auto-detect."
  type        = string
  default     = ""
}

# ============================
# Fetch your laptop's public IPv4 dynamically
# ============================
data "http" "my_ip" {
  url = "https://api.ipify.org"
}

# ============================
# Local variables
# ============================
locals {
  # Laptop IP for security group SSH access
  laptop_ip_cidr = var.my_ip != "" ? var.my_ip : "${trimspace(data.http.my_ip.response_body)}/32"
}

# ============================
# SSH public key path
# ============================
variable "ssh_public_key_path" {
  description = "Path to the SSH public key used for EC2 instances"
  type        = string
  default     = "C:\\Users\\MAGNUM\\.ssh\\my-new-ec2-key.pub"
}


# GitHub repo for OIDC trust
variable "github_oidc_repo" {
  description = "GitHub repository OIDC subject for IAM role"
  type        = string
  default = "repo:darlingtonogbuefi/pdfconverterpro:*"
}
