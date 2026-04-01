resource "google_artifact_registry_repository" "docker" {
  project       = var.project_id
  location      = var.region
  repository_id = "coms-aha-heroes-repo"
  format        = "DOCKER"
  description   = "Docker images for coms-aha-heroes"

  # Dry-run false: policies are actively enforced
  cleanup_policy_dry_run = false

  # KEEP: the 5 most recently pushed image versions
  cleanup_policies {
    id     = "keep-minimum-versions"
    action = "KEEP"
    most_recent_versions {
      keep_count = 5
    }
  }

  # DELETE: any image version older than 30 days
  cleanup_policies {
    id     = "delete-stale-images"
    action = "DELETE"
    condition {
      older_than = "2592000s" # 30 days in seconds
    }
  }
}
