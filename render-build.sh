#!/usr/bin/env bash
# exit on error
set -o errexit

npm install

# Store/pull puppeteer cache with build cache
if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then
  echo "...Copying Puppeteer Cache from Build Cache"
  npx puppeteer browsers install chrome
fi
