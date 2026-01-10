# ============================
# CloudFront OAI for Frontend
# ============================
resource "aws_cloudfront_origin_access_identity" "frontend_oai" {
  comment = "OAI for ${var.project_name}-frontend-${var.environment}"
}

# ============================
# CloudFront Distribution
# ============================
resource "aws_cloudfront_distribution" "frontend" {
  enabled = true
  comment = "CloudFront distribution for frontend S3 bucket"

  depends_on = [
    aws_s3_bucket.frontend,
    aws_s3_bucket.files,
    aws_s3_bucket_policy.frontend_policy,
    aws_s3_bucket_policy.files_policy
  ]

  # S3 Origin
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend_oai.cloudfront_access_identity_path
    }
  }

  # ALB / API Origin
  origin {
    domain_name = "pdfconvertpro-alb-296469480.us-east-1.elb.amazonaws.com"
    origin_id   = "ALB-Backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default Cache Behavior (SPA / S3)
  default_cache_behavior {
    target_origin_id       = "S3-${aws_s3_bucket.frontend.id}"
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

  # Ordered Cache Behavior for API
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "ALB-Backend"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    compress         = true

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # SPA support: serve index.html for 403/404
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  # Viewer Certificate
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # Geo Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
