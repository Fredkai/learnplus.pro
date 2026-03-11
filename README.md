# Master Setup Overview: Learnplus & Bora Foundation

This server hosts two independent websites using Oracle Cloud Infrastructure and Cloudflare Tunnels.

---

## 🖥️ Server Infrastructure
- **Server IP**: `79.76.99.84`
- **Operating System**: Ubuntu 24.04 LTS
- **SSH Access**: Restricted via private key auth.

---

## 🌐 Project 1: Bora Foundation
A static website serving as the primary foundation portal.

- **Public URL**: [https://borafoundation.com/](https://borafoundation.com/)
- **Document Root**: `/var/www/html`
- **Tunnel Service**: `cloudflared.service` (Account A)

---

## 🎓 Project 2: Learnplus.pro
A WordPress powerhouse migrated from Hostinger.

- **Public URL**: [https://learnplus.pro/](https://learnplus.pro/)
- **Document Root**: `/var/www/learnplus.pro`
- **Tunnel Service**: `cloudflared-learnplus.service` (Account B)

### 🗄️ Database (Learnplus)
> [!NOTE]
> Database credentials (User, Password, Host) are stored securely in `/var/www/learnplus.pro/wp-config.php`.

---

## 🛡️ Cloudflare Multi-Tunnel System
The server runs two separate instances of `cloudflared` to support independent Cloudflare accounts.

- **Account A (Bora Foundation)**: Managed via standard tunnel service.
- **Account B (Learnplus)**: Managed via `cloudflared-learnplus` service.

---

## ✅ Full Setup & Configuration Checklist

### 🏗️ Infrastructure & Migration
- [x] **Legacy Recovery**: Extracted `public_html` from Hostinger backups using `extract.py`.
- [x] **Database Restoration**: Migrated MySQL data and initialized user permissions via `db_setup.sql`.
- [x] **Config Patching**: Automated `wp-config.php` updates (DB credentials/Salts) using `patch_wp_config.py`.
- [x] **URL Synchronization**: Mass-updated WordPress site URLs and GUIDs using `update_wp_urls.py`.

### 🛡️ Security & Networking
- [x] **SSH Hardening**: Enabled private key authentication; verified via `ssh-key-2026-03-04.key`.
- [x] **Multi-Tunneling**: Deployed dual `cloudflared` instances for account isolation (Account A & B).
- [x] **Virtual Hosts**: Configured Apache `.conf` files to isolate Bora and Learnplus document roots.
- [x] **Secure Storage**: Externalized credentials from version control to server-side environments.

### 🎨 WordPress & Design
- [x] **Content Sync**: Preserved 100% of original blog posts and media assets during migration.
- [x] **Gallery Overhaul**: Rebranded gallery as "Insurance Giveaways" with high-res optimized images.
- [x] **Theme Refinement**: Synchronized logo styles and modernized the Hero section design.
- [x] **Permalinks**: Verified `.htaccess` rules for clean URL structures post-migration.

### 📩 Email & Lead Capture
- [x] **SMTP Integration**: Configured Fluent SMTP with Brevo (Sendinblue) for reliable delivery.
- [x] **Subscription Flow**: Integrated Mailchimp for WordPress; verified via `check_mc4wp_settings.php`.
- [x] **Contact Reliability**: Replaced native `mail()` with authenticated SMTP via `contact-handler.php`.
- [x] **Admin Alerts**: Enabled real-time email notifications for new subscriber signups.

---

## 🛠️ Maintenance Commands

| Action | Command |
| :--- | :--- |
| **Check Both Tunnels** | `sudo systemctl status cloudflared*` |
| **Check Web Server** | `sudo systemctl status apache2` |
| **Bora Access Logs** | `sudo tail -n 20 /var/log/apache2/access.log` |
| **Learnplus Access Logs** | `sudo tail -n 20 /var/log/apache2/learnplus_access.log` |
| **Restart Services** | `sudo systemctl restart apache2 cloudflared cloudflared-learnplus` |

---
*Setup documented on March 9, 2026. Credentials have been omitted for security.*
