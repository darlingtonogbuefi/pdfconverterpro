# infra_core/outputs.tf

# infra_core/outputs.tf

# ============================
# Default SSH users per VM
# ============================
output "bastion_ssh_user" {
  value       = "ec2-user"
  description = "Default SSH user for the bastion host (Amazon Linux 2023)"
}

output "api_ssh_user" {
  value       = "ubuntu"
  description = "Default SSH user for the API EC2 instance (Ubuntu 22.04)"
}

output "worker_ssh_user" {
  value       = "ubuntu"
  description = "Default SSH user for the worker EC2 instance (Ubuntu 22.04)"
}

# ============================
# Bastion outputs
# ============================
output "bastion_public_ip" {
  value       = aws_instance.bastion.public_ip
  description = "Public IP of the bastion host"
}

output "bastion_private_ip" {
  value       = aws_instance.bastion.private_ip
  description = "Private IP of the bastion host"
}

output "bastion_ssh_command" {
  value       = "ssh ec2-user@${aws_instance.bastion.public_ip}"
}

# ============================
# API & Worker outputs
# ============================
output "api_private_ip" {
  value       = aws_instance.api.private_ip
  description = "Private IP of the API EC2 instance"
}

output "worker_private_ip" {
  value       = aws_instance.worker.private_ip
  description = "Private IP of the worker EC2 instance"
}

output "api_ssh_command" {
  value       = "ssh -J ec2-user@${aws_instance.bastion.public_ip} ubuntu@${aws_instance.api.private_ip}"
}

output "worker_ssh_command" {
  value       = "ssh -J ec2-user@${aws_instance.bastion.public_ip} ubuntu@${aws_instance.worker.private_ip}"
}

# ============================
# SQS & S3
# ============================
output "sqs_queue_url" {
  value       = aws_sqs_queue.jobs.id
  description = "URL of the SQS jobs queue"
}

output "frontend_bucket_name" {
  description = "The name of the S3 bucket used for hosting the frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "files_bucket_name" {
  description = "The name of the S3 bucket used for storing backend files"
  value       = aws_s3_bucket.files.bucket
}

# ============================
# RDS
# ============================
output "db_endpoint" {
  value       = aws_db_instance.converter.endpoint
  description = "Private endpoint of the Postgres RDS instance"
}

# ============================
# VPC & Networking
# ============================
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the main VPC"
}

output "nat_gateway_id" {
  value       = aws_nat_gateway.nat.id
  description = "NAT Gateway ID for private subnets internet access"
}

output "nat_gateway_eip" {
  value       = aws_eip.nat.public_ip
  description = "Public IP of the NAT Gateway"
}

# ============================
# ALB
# ============================
output "alb_dns_name" {
  value       = aws_lb.app.dns_name
  description = "Public DNS name of the Application Load Balancer"
}

output "alb_arn" {
  value       = aws_lb.app.arn
  description = "ARN of the Application Load Balancer"
}

output "alb_security_group_id" {
  value       = aws_security_group.alb_sg.id
  description = "Security group ID of the ALB"
}

# ============================
# VPC Endpoints
# ============================
output "s3_vpc_endpoint_id" {
  value       = aws_vpc_endpoint.s3.id
  description = "S3 VPC Endpoint ID"
}

output "sqs_vpc_endpoint_id" {
  value       = aws_vpc_endpoint.sqs.id
  description = "SQS VPC Endpoint ID"
}

# ============================
# CloudFront Outputs
# ============================
output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.frontend.id
  description = "CloudFront distribution ID for cache invalidation"
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.frontend.domain_name
  description = "CloudFront domain name for frontend access"
}

output "github_actions_role_arn" {
  description = "The ARN of the IAM role assumed by GitHub Actions for deployment and automation tasks."
  value       = aws_iam_role.github_actions.arn
}

# Output API EC2 IDs
output "api_instance_ids" {
  description = "The EC2 instance IDs for API servers"
  value       = [aws_instance.api.id]
}

# Output Worker EC2 IDs
output "worker_instance_ids" {
  description = "The EC2 instance IDs for Worker servers"
  value       = [aws_instance.worker.id]
}
