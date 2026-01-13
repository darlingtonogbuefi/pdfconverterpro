# infra_core_terraform\remote_state.tf    

###########################################################
# Terraform Remote State Configuration (S3 + DynamoDB)
# Backend ONLY — provider and region defined elsewhere
###########################################################

terraform {
  backend "s3" {
    bucket         = "pdfconverterpro-terraform-state"
    key            = "infra_core_terraform/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
