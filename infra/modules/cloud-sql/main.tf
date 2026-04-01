# Generate a cryptographically random 32-char password — no human ever types this
resource "random_password" "db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>?"
}

resource "google_sql_database_instance" "main" {
  project          = var.project_id
  name             = "coms-aha-heroes-db"
  region           = var.region
  database_version = "POSTGRES_18"

  deletion_protection = true

  settings {
    tier = var.tier

    ip_configuration {
      # Public IP enabled; Auth Proxy is the only allowed access path.
      # No authorized_networks block = no direct TCP access from the internet.
      ipv4_enabled = true
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "18:00"
      point_in_time_recovery_enabled = true

      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    insights_config {
      query_insights_enabled = true
    }
  }
}

resource "google_sql_user" "master" {
  project  = var.project_id
  instance = google_sql_database_instance.main.name
  name     = var.db_user
  password = random_password.db.result
}

resource "google_sql_database" "production" {
  project  = var.project_id
  instance = google_sql_database_instance.main.name
  name     = "coms_aha_heroes_production"
}

resource "google_sql_database" "staging" {
  project  = var.project_id
  instance = google_sql_database_instance.main.name
  name     = "coms_aha_heroes_staging"
}

# ── Secret Manager ────────────────────────────────────────────────────────────

resource "google_project_service" "secretmanager" {
  project            = var.project_id
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

locals {
  db_socket_dir           = "/cloudsql/${google_sql_database_instance.main.connection_name}"
  production_database_url = "postgres://${var.db_user}:${random_password.db.result}@localhost/coms_aha_heroes_production?host=${local.db_socket_dir}&pool_max=5"
  staging_database_url    = "postgres://${var.db_user}:${random_password.db.result}@localhost/coms_aha_heroes_staging?host=${local.db_socket_dir}&pool_max=5"
}

resource "google_secret_manager_secret" "db_url_production" {
  project   = var.project_id
  secret_id = "coms-aha-heroes-db-url-production"
  replication { 
    auto {} 
  }
  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "db_url_production" {
  secret      = google_secret_manager_secret.db_url_production.id
  secret_data = local.production_database_url
}

resource "google_secret_manager_secret" "db_url_staging" {
  project   = var.project_id
  secret_id = "coms-aha-heroes-db-url-staging"
  replication { 
    auto {}
  }
  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "db_url_staging" {
  secret      = google_secret_manager_secret.db_url_staging.id
  secret_data = local.staging_database_url
}
