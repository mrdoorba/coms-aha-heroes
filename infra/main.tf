module "artifact_registry" {
  source     = "./modules/artifact-registry"
  project_id = var.project_id
  region     = var.region
}

module "storage" {
  source     = "./modules/storage"
  project_id = var.project_id
}

module "cloud_sql" {
  source     = "./modules/cloud-sql"
  project_id = var.project_id
  region     = var.region
  db_user    = var.db_user
  tier       = var.db_tier
}

module "monitoring" {
  source                  = "./modules/monitoring"
  project_id              = var.project_id
  cloud_run_service_name  = "coms-aha-heroes-app"
  cloud_run_url           = module.cloud_run.service_url
  cloud_sql_instance_name = module.cloud_sql.instance_name
  alert_email             = var.alert_email
}

module "sheet_sync" {
  source             = "./modules/sheet-sync"
  project_id         = var.project_id
  cloud_run_sa_email = "coms-aha-heroes-run-sa@${var.project_id}.iam.gserviceaccount.com"
}

# ── Cloud Scheduler: daily sheet sync ────────────────────────────────────────

resource "google_service_account" "sheet_sync_scheduler" {
  project      = var.project_id
  account_id   = "sheet-sync-scheduler"
  display_name = "Sheet Sync Scheduler (invokes Cloud Run)"
}

resource "google_cloud_run_v2_service_iam_member" "scheduler_invoker" {
  project  = var.project_id
  location = var.region
  name     = "coms-aha-heroes-app"
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.sheet_sync_scheduler.email}"

  depends_on = [module.cloud_run]
}

resource "google_cloud_scheduler_job" "sheet_sync_daily" {
  project          = var.project_id
  region           = var.region
  name             = "sheet-sync-daily"
  description      = "Triggers daily Google Sheets sync at 6 AM WIB"
  schedule         = "0 6 * * *"
  time_zone        = "Asia/Jakarta"
  attempt_deadline = "600s"

  http_target {
    http_method = "POST"
    uri         = "${module.cloud_run.service_url}/api/cron/sheet-sync"
    oidc_token {
      service_account_email = google_service_account.sheet_sync_scheduler.email
      audience              = module.cloud_run.service_url
    }
  }

  depends_on = [module.cloud_run, google_cloud_run_v2_service_iam_member.scheduler_invoker]
}

module "cloud_run" {
  source              = "./modules/cloud-run"
  project_id          = var.project_id
  region              = var.region
  image               = var.app_image
  db_connection_name  = module.cloud_sql.connection_name
  db_url_secret_id         = module.cloud_sql.db_url_production_secret_id
  db_url_staging_secret_id = module.cloud_sql.db_url_staging_secret_id
  uploads_bucket_name = module.storage.uploads_bucket_name
  exports_bucket_name = module.storage.exports_bucket_name
  sheet_sync_sa_key_secret_id = module.sheet_sync.sa_key_secret_id
  sheet_sync_config = {
    sheet_id_points    = var.sheet_id_points
    sheet_id_employees = var.sheet_id_employees
    tab_employees      = "HEROES - Fulltime Staff"
    tab_bintang        = "Poin Bintang"
    tab_penalti        = "Poin Penalti"
    tab_poin_aha       = "Poin AHA"
    tab_redeem         = "Redeem Poin AHA"
    sync_interval_ms   = "600000"
  }

  depends_on = [module.cloud_sql, module.storage, module.sheet_sync]
}

module "github_wif" {
  source                          = "./modules/github-wif"
  project_id                      = var.project_id
  github_org                      = var.github_org
  github_repo                     = var.github_repo
  cloud_run_service_account_email = module.cloud_run.service_account_email
}
