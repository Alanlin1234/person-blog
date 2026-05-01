# User manual — Person Blog

## For readers

- **Home:** latest published posts with title, date, and **view count** (approximate; see below).
- **Article:** open a post to read; a **single view** is recorded after the page loads (not during preview or draft editing).
- **Search:** use the Search page; results show a short **highlighted** snippet.
- **Comments (when enabled):** log in, write a comment or reply; new comments may be **pending** until an administrator approves them.

### View count rules

- One increment per **visitor fingerprint** (anonymous: derived from IP + browser) per **24 hours** per article, when Redis is configured; otherwise a database dedupe row is used.
- **Bots / common crawlers** are ignored.
- **Preview and admin editor** do not increase views.

## For authors / administrators

### Account

- **Register** with a strong password (8+ characters including uppercase, lowercase, number, and special character). Verify email using the link sent to your inbox (in development, the link may be printed to the API console if SMTP is not configured).
- **Login** with optional **Remember me** (longer refresh cookie).
- **Logout** clears refresh tokens on the server.

### Writing posts (admin)

1. Open **Admin → New draft**.
2. Edit **title** and body in the **rich-text editor**. **Preview** uses the same HTML pipeline as the published page.
3. **Draft auto-save** runs every **30 seconds**; you can click **Save now** anytime.
4. Click **Publish** when ready (appears on the public home page if not hidden).

Post states: **draft**, **published**, **archived**. Authors can **pin**, **hide**, or **soft-delete** from the API (UI can be extended).

### Versions

Each save that changes HTML creates a snapshot; only the **latest five** versions are kept per post.

### Taxonomy (admin)

- **Categories:** tree, drag/order via API `sort_order`; managed by **admin** role only.
- **Tags:** create, rename, delete — admin only.

### Comments moderation (admin)

- **Admin → Moderate comments:** list **pending** comments; **Approve**, **Reject**, or **Delete**.
- Authors receive **email** (if SMTP configured) and **in-app notifications** for new comments on their posts; users receive notifications when someone replies to their comment.

### Profile

- **Profile** page: display name, bio, **theme** (Light / Dark / Sepia), **Logout**.
- **Avatar:** upload jpg/png up to **2 MB** via API `POST /api/media/avatar` (crop on client optional; wire `react-easy-crop` in a follow-up).

### Backups (admin)

- `POST /api/admin/backup/run` triggers `mysqldump` when the binary is available on the server. A daily job runs at **03:00** server time.

## API documentation

Interactive docs: `/api/docs` (Swagger UI) when the API is running.
