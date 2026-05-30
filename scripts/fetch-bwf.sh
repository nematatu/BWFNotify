#!/bin/sh
set -eu

url=${1:-https://extranet-lv.bwfbadminton.com/api/match-center/vue-current-live}

curl --http1.1 -sS \
  -H 'Accept: application/json,text/plain,*/*' \
  -H 'Accept-Language: ja,en-US;q=0.9,en;q=0.8' \
  -H 'Referer: https://bwfbadminton.com/' \
  -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' \
  "$url" \
  | jq
