Re-authenticate the GCP account `sam@samkirk.com` for Firebase Admin / future GCP use. Run both commands:

1. `gcloud auth login sam@samkirk.com` — refreshes gcloud CLI credentials
2. `gcloud auth application-default login` — refreshes Application Default Credentials (ADC) used by the app to access GCP services like Firebase
