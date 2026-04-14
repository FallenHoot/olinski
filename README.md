# Olinske

Public production repository for olinske.com.

This repository is promoted from a private editorial repository after human approval and publish-gate validation.

## Deploy model

1. Promotion from private editorial repo updates this repository.
2. CI validates Astro build health.
3. Azure Web App workflow deploys production.

## Required secrets

- AZURE_WEBAPP_NAME: Azure Web App name
- AZURE_CLIENT_ID: Azure AD application (service principal) client ID with federated credential
- AZURE_TENANT_ID: Azure tenant ID
- AZURE_SUBSCRIPTION_ID: Azure subscription ID

## Export metadata

Latest export details are in EXPORT-METADATA.json.
