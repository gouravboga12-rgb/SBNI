# AWS EC2 & PostgreSQL Database Setup Guide using `.pem` Key File

This guide walks you step-by-step through setting up your AWS EC2 instance, connecting via SSH using your `.pem` key file (e.g. `instatoken-backend-key.pem`), configuring PostgreSQL on AWS RDS or EC2, running Prisma database migrations, and deploying the Node.js backend.

---

## 📋 Prerequisites

1. Your AWS `.pem` private key file saved on your computer (e.g. `instatoken-backend-key.pem` or `sbni-key.pem`).
2. Public IP Address of your AWS EC2 instance (e.g. `13.126.xx.xx` or your domain name).
3. SSH Terminal (PowerShell, Command Prompt, Git Bash, or Linux Terminal).

---

## 🔑 Step 1: Connect to AWS EC2 Instance via SSH

### 1.1 Set Key Permissions (Windows PowerShell / WSL / Linux)

For Linux / macOS / WSL, ensure correct key permissions:
```bash
chmod 400 "C:\path\to\your\instatoken-backend-key.pem"
```

For Windows PowerShell:
```powershell
icacls "C:\path\to\your\instatoken-backend-key.pem" /inheritance:r
icacls "C:\path\to\your\instatoken-backend-key.pem" /grant:r "$($env:USERNAME):R"
```

### 1.2 SSH into your AWS EC2 Instance

Run the following SSH command in your terminal (replace `your-ec2-public-ip` with your actual EC2 IPv4 address):

```bash
ssh -i "d:\Company Projects\Insta Token\instatoken-backend-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```
> **Note:** For Amazon Linux instances, use `ec2-user@<YOUR_EC2_PUBLIC_IP>`. For Ubuntu Server instances, use `ubuntu@<YOUR_EC2_PUBLIC_IP>`.

---

## 🛠️ Step 2: Install Node.js, Git, and PostgreSQL on AWS EC2

Once logged into your EC2 server, execute:

```bash
# Update server package lists
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS & npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# Verify installations
node -v
npm -v
git --version
```

### Option A: Install PostgreSQL directly on EC2 (Local DB)

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create Database and Database User for SBNI App
sudo -u postgres psql -c "CREATE DATABASE sbni_db;"
sudo -u postgres psql -c "CREATE USER sbni_user WITH PASSWORD 'SBNIMoneyPostgres2026!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sbni_db TO sbni_user;"
```

Your `DATABASE_URL` for `schema.prisma` will be:
```env
DATABASE_URL="postgresql://sbni_user:SBNIMoneyPostgres2026!@localhost:5432/sbni_db?schema=public"
```

### Option B: Use AWS RDS PostgreSQL Instance

If using AWS RDS PostgreSQL:
1. Copy your AWS RDS Endpoint (e.g. `sbni-db.xxxxxx.ap-south-1.rds.amazonaws.com`).
2. Ensure your EC2 Security Group is allowed in RDS Inbound Rules on Port `5432`.
3. Set your `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://<db_username>:<db_password>@<rds_endpoint>:5432/<db_name>?schema=public"
```

---

## 🚀 Step 3: Clone Codebase & Set Environment Variables

```bash
# Navigate to web directory
cd /var/www || cd ~

# Clone repository
git clone <YOUR_GIT_REPOSITORY_URL> sbni-app
cd sbni-app/backend

# Install dependencies
npm install

# Create production environment file (.env)
nano .env
```

Paste the following environment variables into `.env`:

```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://sbni_user:SBNIMoneyPostgres2026!@localhost:5432/sbni_db?schema=public"
JWT_SECRET="SBNI_SUPER_SECURE_JWT_SECRET_KEY_2026_@FINTECH"
JWT_REFRESH_SECRET="SBNI_SUPER_SECURE_REFRESH_SECRET_KEY_2026_@FINTECH"
SUPER_ADMIN_EMAIL="srinivaspolepalli10@gmail.com"
SUPER_ADMIN_PASSWORD="Srinivas@10"
```

---

## 🌱 Step 4: Run Prisma Database Migrations & Seed Admin User

```bash
# Push Prisma Schema to AWS PostgreSQL Database
npx prisma db push

# Seed Super Admin Account (srinivaspolepalli10@gmail.com / Srinivas@10)
npx prisma db seed

# Build Production TypeScript Backend
npm run build
```

Upon running `npx prisma db seed`, you will see:
```text
🌱 Starting SBNI Money App Database Seed...
✅ Super Admin created: srinivaspolepalli10@gmail.com
✅ Subscription plans seeded.
✅ Banners & FAQs seeded.
🎉 SBNI Money Database Seeding Completed Successfully!
```

---

## 🔄 Step 5: Process Management with PM2 (Background Daemon)

Install PM2 to keep the Node.js server running 24/7 in the background:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend application
pm2 start dist/server.js --name "sbni-backend"

# Enable auto-restart on system reboot
pm2 startup
pm2 save
```

Useful PM2 Commands:
- `pm2 status` - Check status of backend process
- `pm2 logs sbni-backend` - View live server application logs
- `pm2 restart sbni-backend` - Restart backend server

---

## 🌐 Step 6: Configure Nginx & SSL Certificate (HTTPS)

```bash
# Install Nginx
sudo apt install -y nginx

# Configure Nginx Reverse Proxy
sudo nano /etc/nginx/sites-available/sbni
```

Paste configuration:
```nginx
server {
    listen 80;
    server_name api.sbnimoney.com <YOUR_EC2_PUBLIC_IP>;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site & reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/sbni /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 Super Admin Access Summary

Once deployed, access `/admin` on your application:
- **Route:** `http://<your-domain-or-ip>/admin`
- **Admin Email:** `srinivaspolepalli10@gmail.com`
- **Admin Password:** `Srinivas@10`
- **Role:** `SUPER_ADMIN`
