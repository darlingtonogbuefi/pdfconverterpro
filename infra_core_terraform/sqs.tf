# infra_core_terraform\sqs.tf

# ============================
# Dead Letter Queue (DLQ)
# ============================
resource "aws_sqs_queue" "dlq" {
  name = "${var.project_name}-jobs-dlq"

  tags = {
    Name = "${var.project_name}-jobs-dlq"
  }
}

# ============================
# Main Jobs Queue
# ============================
resource "aws_sqs_queue" "jobs" {
  name                      = "${var.project_name}-jobs"
  visibility_timeout_seconds = 900

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "${var.project_name}-jobs"
  }
}

# ============================
# Optional Frontend Status Queue
# (for sending job completion/failure updates)
# ============================
resource "aws_sqs_queue" "frontend_status" {
  name = "${var.project_name}-frontend-status"

  tags = {
    Name = "${var.project_name}-frontend-status"
  }
}