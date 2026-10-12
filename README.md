# LearnPlus

Production website for learnplus.pro, retaining the existing responsive HTML/CSS design. Legacy WordPress is removed. No database or PHP is required.

## Cloudflare Git deployment

Use the main branch and repository root. Leave the build command blank and set deploy command to `npx wrangler deploy`. Use Node.js 22 or later. The configuration serves public_html and runs src/worker.mjs for /api/* only.

Deploy into the Cloudflare account where learnplus.pro Email Routing is active and learnreachabroad@gmail.com is a verified destination. The CONTACT_EMAIL binding is restricted to that inbox; enquiries originate from info@learnplus.pro and use the visitor's email as Reply-To. The rate limiter permits five attempts per minute per IP at each Cloudflare location; shared-network visitors share that allowance.

Test the workers.dev preview first, then add learnplus.pro and www.learnplus.pro under Worker Settings > Domains & Routes. Keep the existing Cloudflare email MX/TXT records. Confirm a real form submission arrives in Gmail before considering delivery verified. Sending to an account's verified destination is supported without a separate form provider.

## Development

Install Node.js 22+, then run `npm ci`, `npm test`, and `npm run preview`. `npm run deploy` publishes to Cloudflare. A local file preview supports browsing but cannot send enquiries. Local simulated tests do not prove live email delivery.

## Public files

public_html contains index.html, services.html, privacy.html, 404.html, robots.txt, sitemap.xml, security headers and four assets. .assetsignore limits deployment to these public files. The frontend provides search, saved services, grid/list views and a contact dialog. Saved preferences stay on the visitor's device.

Never commit private keys, credentials, .env files, private configuration, deployment archives or node_modules. Cleanup preserves Git history; it does not erase previous commits.