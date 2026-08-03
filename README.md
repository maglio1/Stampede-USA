# Stampede USA Website

Official website for Stampede USA — Tampa Bay digital marketing agency.

## Project Structure

```
stampede-usa-website/
├── index.html              # Homepage
├── work.html               # Case studies
├── faq.html                # FAQ (with FAQPage schema)
├── resources.html          # Gated free downloads
├── privacy-policy.html
├── terms-of-service.html
├── letstalk/               # Standalone booking page (noindex)
│   └── index.html
├── assets/
│   ├── images/
│   └── pdfs/               # 12 lead-magnet downloads
├── css/
│   ├── style.css
│   └── pages.css
├── js/
│   └── main.js             # Forms, scheduler, lazy-load, analytics
├── ops/                    # NOT deployed (gitignored) — Apps Script source
├── audits/                 # NOT deployed (gitignored) — historical audits
├── CNAME                   # stampedeusa.com (GitHub Pages)
├── sitemap.xml
├── robots.txt
├── PUSH_TO_GITHUB.bat
├── .gitignore
└── README.md
```

## Lead pipeline

Forms POST JSON to a Google Apps Script webhook (source of truth for the deployed
script: `ops/apps-script-doPost.gs` — paste into script.google.com and redeploy
after edits; the repo copy alone changes nothing live). Leads land in a Google
Sheet; alerts go out by email on every lead, plus SMS via Twilio (credentials in
Script Properties, never in source).

## Development

This is a static HTML/CSS/JS website. Open `index.html` in a browser to preview locally.
