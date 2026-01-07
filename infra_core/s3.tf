# infra_core/s3.tf

resource "aws_s3_bucket" "files" {
  bucket        = "${var.project_name}-files-${var.environment}"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "files" {
  bucket = aws_s3_bucket.files.id

  versioning_configuration {
    status = "Enabled"
  }
}
