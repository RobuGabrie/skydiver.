#!/usr/bin/env bash
# Build both the web app and the mobile app from one command.
#
# Usage:
#   ./scripts/build-all.sh              # build both (web prod + mobile local Android release)
#   ./scripts/build-all.sh web          # web only
#   ./scripts/build-all.sh mobile       # mobile only
#   ./scripts/build-all.sh --eas        # use EAS cloud build for mobile (preview profile)
#   ./scripts/build-all.sh mobile --eas-prod
#
# Env overrides:
#   MOBILE_PROFILE=preview|production    (EAS profile, default: preview)
#   SKIP_INSTALL=1                       (skip npm install in each project)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT/web"
MOBILE_DIR="$ROOT/mobile"
DIST_DIR="$ROOT/dist"

TARGET="all"
USE_EAS=0
MOBILE_PROFILE="${MOBILE_PROFILE:-preview}"

for arg in "$@"; do
  case "$arg" in
    web|mobile|all)   TARGET="$arg" ;;
    --eas)            USE_EAS=1 ;;
    --eas-prod)       USE_EAS=1; MOBILE_PROFILE="production" ;;
    -h|--help)        sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

log() { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
err() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; }

mkdir -p "$DIST_DIR"

install_if_needed() {
  local dir="$1"
  [[ "${SKIP_INSTALL:-0}" == "1" ]] && return 0
  if [[ ! -d "$dir/node_modules" ]] || [[ "$dir/package.json" -nt "$dir/node_modules" ]]; then
    log "Installing deps in $(basename "$dir")"
    (cd "$dir" && npm install --no-audit --no-fund)
  fi
}

build_web() {
  log "Building web (Next.js production)"
  install_if_needed "$WEB_DIR"
  (cd "$WEB_DIR" && npm run build)
  ok "Web build complete → $WEB_DIR/.next"
}

build_mobile_local() {
  log "Building mobile (Android release APK, local)"
  install_if_needed "$MOBILE_DIR"
  if [[ ! -d "$MOBILE_DIR/android" ]]; then
    err "android/ folder missing — run 'npx expo prebuild' in mobile/ first"
    return 1
  fi
  (cd "$MOBILE_DIR/android" && ./gradlew --no-daemon assembleRelease)
  local apk
  apk="$(find "$MOBILE_DIR/android/app/build/outputs/apk/release" -name '*.apk' | head -n1)"
  if [[ -n "$apk" ]]; then
    cp "$apk" "$DIST_DIR/skydiver-mobile-release.apk"
    ok "APK → $DIST_DIR/skydiver-mobile-release.apk"
  else
    err "APK not found"
    return 1
  fi
}

build_mobile_eas() {
  log "Building mobile via EAS (profile: $MOBILE_PROFILE)"
  install_if_needed "$MOBILE_DIR"
  if ! command -v eas >/dev/null 2>&1; then
    err "eas CLI not found. Install with: npm i -g eas-cli"
    return 1
  fi
  (cd "$MOBILE_DIR" && eas build --platform android --profile "$MOBILE_PROFILE" --non-interactive)
  ok "EAS build submitted (artifact link printed above)"
}

build_mobile() {
  if [[ "$USE_EAS" == "1" ]]; then build_mobile_eas; else build_mobile_local; fi
}

case "$TARGET" in
  web)    build_web ;;
  mobile) build_mobile ;;
  all)    build_web && build_mobile ;;
esac

ok "Done."
