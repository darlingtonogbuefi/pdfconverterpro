# infra_core/variables.tf

# AWS region
variable "aws_region" {
  description = "AWS region where all infrastructure resources will be created"
  type        = string
  default     = "us-east-1"
}

# Project name
variable "project_name" {
  description = "Base name of the project, used for naming AWS resources"
  type        = string
  default     = "converter"
}

# Deployment environment
variable "environment" {
  description = "Deployment environment name (e.g. dev, staging, prod)"
  type        = string
  default     = "pdfconvertpro"
}

# EC2 instance type
variable "instance_type" {
  description = "EC2 instance type used for application and worker instances"
  type        = string
  default     = "t3.medium"
}

# EC2 key pair
variable "key_name" {
  description = "Name of the AWS EC2 key pair used for SSH access"
  type        = string
  default     = "my-ec2-key"
}

# RDS database credentials
variable "db_user" {
  description = "Master username for the RDS database instance"
  type        = string
}

variable "db_password" {
  description = "Master password for the RDS database instance"
  type        = string
  sensitive   = true
}

# Fetch your laptop's public IPv4 dynamically
data "http" "my_ip" {
  url = "https://api.ipify.org"
}

# Local variable for security group
locals {
  # Use response_body instead of deprecated body and trim whitespace
  laptop_ip_cidr = "${trimspace(data.http.my_ip.response_body)}/32"
}
