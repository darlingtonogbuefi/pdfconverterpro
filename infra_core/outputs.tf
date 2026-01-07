# infra_core/outputs.tf

# Outputs for EC2 instances (private subnets)
output "api_private_ip" {
  value = aws_instance.api.private_ip
  description = "Private IP of the API EC2 instance in the private subnet"
}

output "worker_private_ip" {
  value = aws_instance.worker.private_ip
  description = "Private IP of the worker EC2 instance in the private subnet"
}

# Outputs for SQS & S3
output "sqs_queue_url" {
  value       = aws_sqs_queue.jobs.id
  description = "URL of the SQS jobs queue"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.files.bucket
  description = "Name of the S3 bucket"
}

# RDS Endpoint (private)
output "db_endpoint" {
  value       = aws_db_instance.converter.endpoint
  description = "Private endpoint of the Postgres RDS instance"
}

# VPC ID
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the main VPC"
}

# ALB Outputs
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


output "bastion_public_ip" {
  value = aws_instance.bastion.public_ip
}

output "bastion_private_ip" {
  value = aws_instance.bastion.private_ip
}
