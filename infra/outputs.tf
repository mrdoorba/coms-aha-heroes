output "cloud_run_url" {
  description = "Public URL of the Cloud Run service"
  value       = module.cloud_run.service_url
}

output "artifact_registry_hostname" {
  description = "Docker push hostname for Artifact Registry"
  value       = "${var.region}-docker.pkg.dev"
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name for Auth Proxy"
  value       = module.cloud_sql.connection_name
}

output "cloud_run_service_account" {
  description = "Service account email used by Cloud Run"
  value       = module.cloud_run.service_account_email
}
