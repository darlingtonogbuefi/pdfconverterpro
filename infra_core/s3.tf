#  infra_core\s3.tf

# ============================
# S3 Bucket for Files
# ============================
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

# S3 Bucket Policy for Files (CloudFront OAI access)
resource "aws_s3_bucket_policy" "files_policy" {
  bucket = aws_s3_bucket.files.id
  depends_on = [aws_s3_bucket.files, aws_cloudfront_origin_access_identity.frontend_oai]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend_oai.iam_arn
        }
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.files.arn}/*"
      }
    ]
  })
}

# ============================
# S3 Bucket for Frontend Hosting
# ============================
resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.project_name}-frontend-${var.environment}"
  force_destroy = false

  tags = {
    Name        = "${var.project_name}-frontend"
    Environment = var.environment
  }
}

# Website configuration (SPA)
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # SPA routing
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Bucket Policy granting CloudFront OAI access
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id
  depends_on = [aws_s3_bucket.frontend, aws_cloudfront_origin_access_identity.frontend_oai]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend_oai.iam_arn
        }
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}
