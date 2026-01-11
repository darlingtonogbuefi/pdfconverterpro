# infra_core\remote_state.tf



###########################################################
# Terraform Remote State Setup (S3 + DynamoDB locking)
###########################################################

# Commented out temporarily so Terraform can create the backend resources first
 terraform {
   backend "s3" {
     bucket         = "pdfconverterpro-terraform-state"  # replace with your unique bucket name
     key            = "infra_core/terraform.tfstate"
     region         = "us-east-1"
     dynamodb_table = "terraform-state-lock"
     encrypt        = true
   }
 }

###########################################################
# Optional: Create S3 bucket for remote state (if not exists)
# Only needed if you want Terraform to create the bucket
###########################################################
resource "aws_s3_bucket" "terraform_state" {
  bucket = "pdfconverterpro-terraform-state"  # must be globally unique
  acl    = "private"

  versioning {
    enabled = true
  }

  tags = {
    Name        = "Terraform State Bucket"
    Environment = "InfraCore"
  }
}

###########################################################
# Optional: Create DynamoDB table for state locking
# Only needed if you want Terraform to create the lock table
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
