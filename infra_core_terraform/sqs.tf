# infra_core_terraform\sqs.tf

resource "aws_sqs_queue" "dlq" {
  name = "${var.project_name}-jobs-dlq"
}

resource "aws_sqs_queue" "jobs" {
  name                      = "${var.project_name}-jobs"
  visibility_timeout_seconds = 900

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}
