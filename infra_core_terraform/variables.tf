# infra_core_terraform\variables.tf

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

variable "pdfconverterpro_repo" {
  description = "GitHub repository URL for pdfconverterpro"
  type        = string
  default     = "https://github.com/darlingtonogbuefi/pdfconverterpro.git"
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for the HTTPS listener"
  type        = string
  default     = "arn:aws:acm:us-east-1:821878754659:certificate/b1bea28d-a671-4cf7-86af-df1c99ccfac8"
}

variable "frontend_s3_bucket_name" {
  description = "Name of the frontend S3 bucket"
  type        = string
  default     = "pdfconvertpro-frontend-prod"
}

variable "files_s3_bucket_name" {
  description = "Name of the S3 bucket used for storing backend files"
  type        = string
  default     = "pdfconvertpro-files-prod"
}

variable "cloudfront_aliases" {
  description = "Custom domain names (CNAMEs) for the CloudFront distribution"
  type        = list(string)
  default     = ["pdfconvertpro.cribr.co.uk"]
}

variable "subdomain_zone_name" {
  description = "Delegated public hosted zone name"
  type        = string
  default     = "pdfconvertpro.cribr.co.uk"
}

variable "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  type        = string
  default     = "d2do2hjvotfo23.cloudfront.net"
}

variable "alb_domain_name" {
  description = "The domain name of the ALB"
  type        = string
  default     = "pdfconvertpro-alb-849414334.us-east-1.elb.amazonaws.com"
}