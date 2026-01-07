# infra_core/rds.tf


# DB Subnet Group (for private subnets)
resource "aws_db_subnet_group" "converter" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS Instance (Postgres)
resource "aws_db_instance" "converter" {
  identifier = "converter-db"

  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_encrypted = true

  db_name  = "converter"
  username = var.db_user
  password = var.db_password

  publicly_accessible = false
  skip_final_snapshot = true

  # Attach DB security group
  vpc_security_group_ids = [
    aws_security_group.db_sg.id
  ]

  # Reference the subnet group (must be private subnets)
  db_subnet_group_name = aws_db_subnet_group.converter.name
}
