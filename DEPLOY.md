# Deployment Guide: Coolify on KVM8

Repo: **https://github.com/daudraza369/delivery-calculator**

---

## Phase 2: Install Coolify on KVM8

### 2.1 SSH into your server

```bash
ssh user@your-kvm8-server-ip
```

### 2.2 Install Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Or:

```bash
curl -fsSL https://get.coolify.io | bash
```

### 2.3 Access Coolify

Open `http://YOUR_SERVER_IP:8000` and complete onboarding.

---

## Phase 3: Deploy from GitHub

### 3.1 Create a new resource in Coolify

1. Create a **Project** (e.g. "District Flowers")
2. **Create New Resource**

### 3.2 Configure the application

| Setting | Value |
|---------|-------|
| **Repository** | Public: `https://github.com/daudraza369/delivery-calculator` |
| **Build Pack** | Nixpacks → **Static** |
| **Base directory** | `/` |
| **Web server** | Nginx |
| **Domain** | Your domain or `http://YOUR_SERVER_IP` |

### 3.3 Deploy

Click **Deploy**. Visit your URL when the build finishes.

---

## Phase 4: Auto-deploy on push (optional)

1. Coolify: Application → **Settings** → **Webhooks** → copy webhook URL
2. GitHub: Repo → **Settings** → **Webhooks** → **Add webhook**
3. Payload URL: paste Coolify webhook, Content type: `application/json`, Events: push
4. Save
