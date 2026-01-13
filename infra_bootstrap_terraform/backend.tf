# infra_bootstrap_terraform\backend.tf

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.100"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

###########################################################
# S3 Bucket for Terraform Remote State
###########################################################
resource "aws_s3_bucket" "terraform_state" {
  bucket        = "pdfconverterpro-terraform-state"
  force_destroy = true  # ensures deletion of Terraform-managed objects

  tags = {
    Name        = "Terraform State Bucket"
    Environment = "InfraCoreterraform"
  }
}

###########################################################
# Enforce modern ownership model (disables ACLs)
###########################################################
resource "aws_s3_bucket_ownership_controls" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

###########################################################
# Block ALL public access (critical)
###########################################################
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

###########################################################
# Enable Versioning (required for state safety)
###########################################################
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

###########################################################
# Enable Server-Side Encryption
###########################################################
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

###########################################################
# DynamoDB Table for State Locking
###########################################################
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Terraform State Lock Table"
    Environment = "InfraCore"
  }
}

###########################################################
# Null Resource to Clean State Bucket Before Destroy
###########################################################
resource "null_resource" "clean_state_bucket" {
  triggers = {
    bucket_name = aws_s3_bucket.terraform_state.id
  }

  provisioner "local-exec" {
    command = "powershell -ExecutionPolicy Bypass -File ./ClearTerraformStateBucket.ps1"
    when    = destroy
  }
}
