# wahlberg.moe 🌐

This repository contains the source code for my personal website [wahlberg.moe](https://wahlberg.moe).  
It’s a space where I share a bit about myself, showcase my projects, and experiment with modern web technologies.

---

## 👤 About Me
Hi! I’m **William Wahlberg** — a machine learning engineer and full-stack developer from Sweden.  
I enjoy building AI systems, web applications, and tinkering with tech from low-level Linux configs to modern frontend frameworks.

---

## 🛠️ Tech Stack
This website is built using:

- **[Next.js](https://nextjs.org/)** – React framework for hybrid static & server rendering
- **[TypeScript](https://www.typescriptlang.org/)** – type safety for JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** – utility-first styling
- **[pnpm](https://pnpm.io/)** – fast, disk-efficient package manager
- **[Caddy](https://caddyserver.com/)** – reverse proxy with automatic HTTPS
- **[PM2](https://pm2.keymetrics.io/)** – process manager to keep the app alive in production

---

## 🚀 Deployment
- Hosted on a **Scaleway VPS**
- Served by **Caddy** (reverse proxy, auto-HTTPS via Let’s Encrypt)
- **PM2** keeps the Next.js app running
- Domain registered at **Namecheap**

---

## 🖥️ Local Development
Clone the repo and install dependencies with [pnpm](https://pnpm.io/):

```bash
git clone https://github.com/<your-username>/wahlberg.moe.git
cd wahlberg.moe
pnpm install
pnpm dev

