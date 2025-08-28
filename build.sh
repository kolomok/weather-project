#!/usr/bin/env bash
set -o errexit
set -o pipefail

echo "== python deps"
pip install -r backend/requirements.txt

echo "== frontend build"
cd frontend
npm install
npm run build
cd ..

# вывести ключи из vite манифеста для проверки
node -e "const m=require('./frontend/dist/.vite/manifest.json'); console.log('MANIFEST KEYS:', Object.keys(m))"

echo "== django collectstatic & migrate"
python backend/manage.py collectstatic --noinput
python backend/manage.py migrate --noinput
