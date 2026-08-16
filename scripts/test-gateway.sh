#!/bin/sh
set -eu

base_url="${GATEWAY_URL:-http://localhost:8080}"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

wait_for_gateway() {
    attempt=0
    while [ "$attempt" -lt 20 ]; do
        if curl -fsS "$base_url/api/health" >/dev/null; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    return 1
}

require_header() {
    header_name="$1"
    expected_value="$2"
    if ! tr -d '\r' <"$temporary_directory/headers" \
        | grep -Eiq "^${header_name}: ${expected_value}$"; then
        echo "Missing or invalid ${header_name} header" >&2
        return 1
    fi
}

wait_for_gateway

status_code="$(
    curl -sS \
        -D "$temporary_directory/headers" \
        -o "$temporary_directory/body" \
        -w '%{http_code}' \
        -H 'X-Request-ID: gateway-security-check' \
        "$base_url/api/health"
)"

[ "$status_code" = "200" ]
require_header "content-security-policy" ".*default-src 'self'.*"
require_header "cross-origin-opener-policy" "same-origin"
require_header "cross-origin-resource-policy" "same-origin"
require_header "permissions-policy" "camera=\(\), geolocation=\(\), microphone=\(\)"
require_header "referrer-policy" "strict-origin-when-cross-origin"
require_header "x-content-type-options" "nosniff"
require_header "x-frame-options" "DENY"
require_header "x-request-id" "gateway-security-check"
require_header "x-xss-protection" "0"

curl -fsS "$base_url/api/layers" >"$temporary_directory/catalog"
grep -q '"id":"ibge-rmsp-municipalities"' "$temporary_directory/catalog"
grep -q '"id":"ibge-rmsp-municipality-points"' "$temporary_directory/catalog"

curl -fsS \
    "$base_url/api/layers/ibge-rmsp-municipalities/features?bbox=-47.35,-24.05,-45.92,-23.05&limit=50" \
    >"$temporary_directory/features"
grep -q '"type":"FeatureCollection"' "$temporary_directory/features"
grep -q '"returned":39' "$temporary_directory/features"

status_code="$(
    dd if=/dev/zero bs=1024 count=20 2>/dev/null \
        | tr '\000' x \
        | curl -sS \
            -X POST \
            --data-binary @- \
            -o /dev/null \
            -w '%{http_code}' \
            "$base_url/api/health"
)"
[ "$status_code" = "413" ]

seq 1 80 | xargs -I request -P 20 sh -c \
    'curl -sS -o /dev/null -w "%{http_code}\n" "$1/api/health"' \
    gateway-request "$base_url" >"$temporary_directory/rate-codes"

if ! grep -q '^429$' "$temporary_directory/rate-codes"; then
    echo "Rate limit did not return HTTP 429" >&2
    exit 1
fi

attempt=0
while [ "$attempt" -lt 30 ]; do
    status_code="$(
        curl -sS \
            -D "$temporary_directory/headers" \
            -o "$temporary_directory/body" \
            -w '%{http_code}' \
            "$base_url/api/health"
    )"
    if [ "$status_code" = "429" ]; then
        break
    fi
    attempt=$((attempt + 1))
done

[ "$status_code" = "429" ]
require_header "content-type" "application/json"
require_header "retry-after" "1"
require_header "x-request-id" "[A-Za-z0-9._:-]+"
grep -q '"detail":"Too many requests"' "$temporary_directory/body"

echo "Gateway security checks passed"
