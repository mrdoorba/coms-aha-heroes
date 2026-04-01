# Set the _Default log bucket retention to 30 days.
# GCP default is 30 days, but this makes it explicit and IaC-managed.
resource "google_logging_project_bucket_config" "default" {
  project        = var.project_id
  location       = "global"
  bucket_id      = "_Default"
  retention_days = 30
}
