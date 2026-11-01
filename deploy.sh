#!/usr/bin/env bash
#
# deploy.sh — Toss App-in-Ad Simulator 배포 스크립트
#
# 이 스크립트는 Vite로 빌드된 dist/ 폴더를 압축하여,
# 토스 개발자 콘솔에 업로드할 "앱인토스 테스트 규격 번들"을 준비합니다.
#
# 사용법: bash deploy.sh
#
# 특징:
# - npm run 빌드 수행 (성공 시 다음 단계 진행)
# - dist/ 폴더를 버전 기반 파일명으로 압축
# - 콘솔 업로드 전 검증 로그 출력
# - sudo 미사용, 시스템 변경 없음 (읽기 전용 작업만 수행)
#

set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")" && pwd)"
PROJECT_NAME="toss-app-in-ad-simulator"

echo "========================================="
echo "📦 ${PROJECT_NAME} — 배포 시작"
echo "========================================="

# 1. 의존성 확인
if [ ! -d "$WORKSPACE/node_modules" ]; then
  echo "❌ node_modules가 존재하지 않습니다. 'npm install'을 실행해주세요."
  exit 1
fi

# 2. 빌드 실행
echo "▶ 'npm run build' 실행 중..."
npm run build 2>&1 | tail -5

echo "✅ 빌드 완료"

# 3. 아카이브 파일명 생성 (타임스탬프 포함)
TIMESTAMP=$(date +%Y%m%d%H%M%S)
ARCHIVE_NAME="${PROJECT_NAME}-test-bundle-${TIMESTAMP}.zip"
ARCHIVE_PATH="${WORKSPACE}/${ARCHIVE_NAME}"

# 4. app.json과 index.html을 최상위 depth에 포함하여 아카이브 생성
# - AIT 규격: app.json과 index.html은 동일한 최상위 디렉터리 depth에 있어야 함
# - 앱 진입점인 index.html은 dist/에서 root level로 복사하여 함께 패키징
echo "▶ ${ARCHIVE_NAME} 생성 중..."
# 일회용 디렉터리에 앱 매니페스트와 리소스 정리하여 압축
BUNDLE_TMP=$(mktemp -d)
# 앱 매니페스트 포함
cp "$WORKSPACE/app.json" "$BUNDLE_TMP/"
# Vite 빌드 산출물에서 진입점 index.html을 최상위로 복사
cp "$WORKSPACE/dist/index.html" "$BUNDLE_TMP/index.html"
# 어셋 디렉터리 그대로 복사 (압축 내에서 assets/ 경로 유지)
cp -r "$WORKSPACE/dist/assets/" "$BUNDLE_TMP/assets/"
# 한 디렉터리에서 재귀 압축 (app.json과 index.html이 동일한 depth에 생성됨)
cd "$BUNDLE_TMP"
zip -r -q "$ARCHIVE_PATH" .
cd "$WORKSPACE"
# 일회용 디렉터리 정리
rm -rf "$BUNDLE_TMP"

echo "✅ 아카이브 생성: ${ARCHIVE_PATH}"
echo "   크기: $(du -h "$ARCHIVE_PATH" | cut -f1)"

# 5. 업로드 전 검증
echo ""
echo "📋 검증 정보:"
echo "   - 패키지: $(node -e "console.log(require('./package.json').name)")"
echo "   - 버전: $(node -e "console.log(require('./package.json').version)")"
echo "   - 주요 의존: @apps-in-toss/web-framework, react, vite"
echo ""
echo "▣ 다음 단계: 토스 개발자 콘솔에 다음과 같이 업로드하세요."
echo "   1. https://console.toss.im/apps-in-toss 로 이동"
echo "   2. '새 앱 등록' 또는 기존 프로젝트 편집"
echo "   3. '웹 앱(파일 업로드)' 섹션에서 ${ARCHIVE_NAME} 선택"
echo "   4. 메타데이터(사용자ID, 광고ID 등) 입력 후 검증"
echo ""
echo "========================================="
echo "📦 배포 완료"
echo "========================================="

# 스크립트 종료 — 실제 콘솔 업로드는 브라우저 수작업 또는 별도 CI/CD 파이프라인에서 수행
exit 0