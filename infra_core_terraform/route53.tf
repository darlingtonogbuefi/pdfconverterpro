# infra_core_terraform\route53.tf

# Look up the delegated public hosted zone in Route 53

data "aws_route53_zone" "subdomain" {
  name         = var.subdomain_zone_name
  private_zone = false
}

# Alias A record → CloudFront
resource "aws_route53_record" "cloudfront_a" {
  zone_id = data.aws_route53_zone.subdomain.zone_id
  name    = var.subdomain_zone_name
  type    = "A"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = "Z2FDTNDATAQYW2" # CloudFront hosted zone ID (global)
    evaluate_target_health = false
  }
}

# Alias AAAA record → CloudFront (IPv6)
resource "aws_route53_record" "cloudfront_aaaa" {
  zone_id = data.aws_route53_zone.subdomain.zone_id
  name    = var.subdomain_zone_name
  type    = "AAAA"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}
