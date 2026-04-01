# Dedicated service account for the Cloud Run service
resource "google_service_account" "cloud_run" {
  project      = var.project_id
  account_id   = "coms-aha-heroes-run-sa"
  display_name = "Cloud Run SA — coms-aha-heroes"
}

# Allow Cloud Run SA to connect to Cloud SQL via Auth Proxy / connector
resource "google_project_iam_member" "cloud_run_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Allow Cloud Run SA to read the DATABASE_URL secret at runtime
resource "google_secret_manager_secret_iam_member" "cloud_run_db_url_access" {
  project   = var.project_id
  secret_id = var.db_url_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_cloud_run_v2_service" "app" {
  project  = var.project_id
  name     = "coms-aha-heroes-app"
  location = var.region

  # Keep at most 10 revisions for rollback; anything older is pruned
  annotations = {
    "run.googleapis.com/launch-stage"  = "GA"
    "run.googleapis.com/maxRevisions"  = "10"
  }

  template {
    service_account = google_service_account.cloud_run.email

    # 250 concurrent requests per instance before a new instance spins up
    max_instance_request_concurrency = 250

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    # Mount Cloud SQL socket directory — avoids needing a VPC connector
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [var.db_connection_name]
      }
    }

    containers {
      image = var.image

      ports {
        container_port = 8080
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = var.db_url_secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        # Release CPU when not handling requests (cost saving)
        cpu_idle = true
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_iam_member.cloud_run_sql_client,
    google_secret_manager_secret_iam_member.cloud_run_db_url_access,
  ]
}

# Allow unauthenticated public access
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
