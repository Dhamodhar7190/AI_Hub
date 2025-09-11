#!/bin/sh

# Create runtime config for React app
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
  REACT_APP_API_URL: "${REACT_APP_API_URL:-http://localhost:8000}",
  REACT_APP_ENVIRONMENT: "${REACT_APP_ENVIRONMENT:-production}",
  REACT_APP_VERSION: "${REACT_APP_VERSION:-1.0.0}"
};
EOF

echo "Runtime configuration created successfully"
echo "API URL: ${REACT_APP_API_URL:-http://localhost:8000}"
echo "Environment: ${REACT_APP_ENVIRONMENT:-production}"

# Start the main process
exec "$@"