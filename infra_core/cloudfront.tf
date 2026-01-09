# infra_core\cloudfront.tf

# ---------------------------
# CloudFront Distribution for Frontend S3 Bucket
# ---------------------------

# Origin Access Identity (OAI) to allow CloudFront to read S3 privately
resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "OAI for frontend CloudFront distribution"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend" {
  enabled = true
  comment = "CloudFront distribution for frontend S3 bucket"

  # ⚠ Must be singular `origin`
  origin {
    domain_name = aws_s3_bucket.files.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.files.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    target_origin_id       = "S3-${aws_s3_bucket.files.id}"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    compress         = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

# ---------------------------
# Optional: S3 Bucket Policy to allow only CloudFront access
# ---------------------------
resource "aws_s3_bucket_policy" "files" {
  bucket = aws_s3_bucket.files.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.files.arn}/*"
      }
    ]
  })
}
