#!/bin/sh
set -eu

if [ ! -f .dev.vars ]; then
  echo ".dev.vars not found" >&2
  exit 1
fi

BWF_COOKIE=$(
  sed -n 's/^BWF_COOKIE="\{0,1\}\(.*\)"\{0,1\}$/\1/p' .dev.vars
)

if [ -z "$BWF_COOKIE" ]; then
  echo "BWF_COOKIE is empty or missing in .dev.vars" >&2
  exit 1
fi

url=${1:-https://extranet-lv.bwfbadminton.com/api/match-center/vue-current-live}

curl --http1.1 -sS \
  -H 'Accept: application/json,text/plain,*/*' \
  -H 'Accept-Language: ja,en-US;q=0.9,en;q=0.8' \
  -H 'Referer: https://bwfbadminton.com/' \
  -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' \
  -b "$BWF_COOKIE" \
  "$url" \
  | jq
