<claude-mem-context>
# Memory Context

# [coms_aha_heroes] recent context, 2026-04-17 11:01am GMT+7

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 18 obs (7,216t read) | 792,682t work | 99% savings

### Apr 13, 2026
1 9:43a 🔵 AHA HEROES GCP Deployment Infrastructure Review
2 " 🔵 AHA HEROES: 5 Blocking CI/CD Gaps Identified Pre-Launch
3 " ⚖️ Upload Architecture: Local Disk → GCS Signed URL Direct Upload
4 " 🔵 Cloud SQL Connection Pool Hard Limit at db-f1-micro
5 " ⚖️ Health Check Probe Design: Separate Liveness vs Startup Endpoints
6 " ⚖️ CI Migration Step: TCP vs Unix Socket URL Format Mismatch
7 9:44a 🔵 Storage Service Is Local Filesystem Only — GCS Not Implemented
8 " 🔵 Database Credentials Exposed in CI Logs via --set-env-vars
9 " 🔵 Auth Env Vars Missing from Cloud Run Terraform — App Will Crash on Boot
10 " 🔵 Entire infra/ Directory Is Untracked in Git
11 " 🔵 Full AHA HEROES Application Structure Mapped
12 9:45a 🔵 Confirmed: storage.ts Uses Local Disk Only — GCS Code Path Not Implemented
13 " 🔵 deploy.yml Exposes Full DB Credentials in GitHub Actions Logs
14 " 🔵 infra/ Directory Is Entirely Untracked in Git
15 " 🔵 Cloud Run Module: Only DATABASE_URL Injected via Secret Manager; Auth Secrets Missing
16 " 🔵 Monitoring Module Contains Only Log Retention Config — No Uptime Checks or Alerts
17 " 🔵 Upload Route Mounted Inside Auth+RLS Guard — Signed URL Endpoint Must Also Be Auth-Gated
18 " 🔵 Google OAuth Blocks Self-Registration — Only Pre-Existing DB Users Can Authenticate

Access 793k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>