#!/bin/bash
# Grants the admin claim to the photographer's account and sets Storage CORS
# on the production project. See fn/index.js for exactly what it does.
set -euo pipefail
EMAIL="${1:?Usage: run.sh <login e-mail of the account that should become admin>}"
cd "$(dirname "$0")"
ln -sfn ../../../functions/node_modules fn/node_modules
../../node_modules/.bin/firebase emulators:exec --only functions --project kuczewska-ee655 \
  "curl -s -G --data-urlencode email=$EMAIL http://127.0.0.1:5055/kuczewska-ee655/us-central1/setup && echo"
