variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "fbi-dev-484410"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-southeast2"
}

variable "db_user" {
  description = "Cloud SQL master user name"
  type        = string
  default     = "app"
}

variable "db_tier" {
  description = "Cloud SQL instance machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "app_image" {
  description = "Full Docker image URI for Cloud Run (overridden per deploy)"
  type        = string
  # Placeholder to bootstrap Cloud Run before the first real image is pushed.
  # After the first successful deploy.yml run, this value is irrelevant —
  # the workflow always overrides it with the SHA-tagged image.
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}
