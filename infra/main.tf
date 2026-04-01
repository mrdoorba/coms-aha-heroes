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
  source     = "./modules/monitoring"
  project_id = var.project_id
}

module "cloud_run" {
  source             = "./modules/cloud-run"
  project_id         = var.project_id
  region             = var.region
  image              = var.app_image
  db_connection_name = module.cloud_sql.connection_name
  db_url_secret_id   = module.cloud_sql.db_url_production_secret_id

  depends_on = [module.cloud_sql]
}
