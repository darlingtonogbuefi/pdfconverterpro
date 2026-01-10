# infra_core/s3.tf

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

# ============================
# S3 Bucket for Frontend Hosting
# ============================
resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.project_name}-frontend-${var.environment}"
  force_destroy = false

  website {
    index_document = "index.html"
    error_document = "index.html"  # Needed for SPA routing
  }

  tags = {
    Name        = "${var.project_name}-frontend"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ============================
# Public Read Policy for Frontend
# ============================
# Temporary: allows CloudFront or public access to S3 frontend bucket
resource "aws_s3_bucket_policy" "frontend_public" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject"]
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# ============================
# CloudFront OAI for Frontend
# ============================
resource "aws_cloudfront_origin_access_identity" "frontend_oai" {
  comment = "OAI for ${var.project_name}-frontend-${var.environment}"
}

# Optional: if you want CloudFront to serve private content:
# You can replace the bucket policy above with one granting access only to the OAI:
# policy = jsonencode({
#   Version = "2012-10-17"
#   Statement = [
#     {
#       Effect = "Allow"
#       Principal = {
#         AWS = aws_cloudfront_origin_access_identity.frontend_oai.iam_arn
#       }
#       Action   = ["s3:GetObject"]
#       Resource = "${aws_s3_bucket.frontend.arn}/*"
#     }
#   ]
# })
