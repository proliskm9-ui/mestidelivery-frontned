#!/bin/bash
# =============================================
# MESTIGO API - Server Setup Script
# For Ubuntu/Debian VPS with Certbot SSL
# =============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Mestigo API Server Setup${NC}"
echo "================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Get domain from user
read -p "Enter your domain (e.g., api.mestigo.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL

# Update system
echo -e "${YELLOW}📦 Updating system...${NC}"
apt update && apt upgrade -y

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx

# Create app directory
APP_DIR="/var/www/mestigo-api"
echo -e "${YELLOW}📁 Creating app directory: $APP_DIR${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Copy server files (assuming they're in current directory)
echo -e "${YELLOW}📋 Copy your server files to $APP_DIR${NC}"

# Create virtual environment
echo -e "${YELLOW}🐍 Creating Python virtual environment...${NC}"
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
echo -e "${YELLOW}📝 Creating .env file...${NC}"
cat > .env << EOF
# Environment
ENV=production
LOG_LEVEL=INFO

# Database - UPDATE THIS!
DATABASE_URL=postgresql+asyncpg://postgres.XXXXX:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Security - CHANGE THIS!
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# CORS
CORS_ORIGINS=*

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=4

# SSL (Certbot paths)
SSL_KEYFILE=/etc/letsencrypt/live/$DOMAIN/privkey.pem
SSL_CERTFILE=/etc/letsencrypt/live/$DOMAIN/fullchain.pem

# Settings
AUTO_SEED=false
ENABLE_DOCS=false
EOF

echo -e "${GREEN}✅ .env created. EDIT IT with your Supabase credentials!${NC}"

# Setup Nginx
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/mestigo-api << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /uploads {
        alias $APP_DIR/uploads;
    }
}
EOF

ln -sf /etc/nginx/sites-available/mestigo-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Get SSL certificate
echo -e "${YELLOW}🔒 Getting SSL certificate with Certbot...${NC}"
certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

# Create systemd service
echo -e "${YELLOW}⚙️ Creating systemd service...${NC}"
cat > /etc/systemd/system/mestigo-api.service << EOF
[Unit]
Description=Mestigo API Server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R www-data:www-data $APP_DIR

# Start service
systemctl daemon-reload
systemctl enable mestigo-api
systemctl start mestigo-api

# Setup auto-renewal for SSL
echo -e "${YELLOW}🔄 Setting up SSL auto-renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "================================"
echo -e "API URL: ${GREEN}https://$DOMAIN${NC}"
echo ""
echo "Next steps:"
echo "1. Edit $APP_DIR/.env with your Supabase credentials"
echo "2. Run: sudo systemctl restart mestigo-api"
echo "3. Check status: sudo systemctl status mestigo-api"
echo "4. View logs: sudo journalctl -u mestigo-api -f"
