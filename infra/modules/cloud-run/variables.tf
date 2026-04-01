variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "image" {
  description = "Full Docker image URI to deploy"
  type        = string
}

variable "db_connection_name" {
  description = "Cloud SQL connection name (PROJECT:REGION:INSTANCE)"
  type        = string
}

variable "db_url_secret_id" {
  description = "Secret Manager secret ID containing the production DATABASE_URL"
  type        = string
}
