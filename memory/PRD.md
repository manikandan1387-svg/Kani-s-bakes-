# Kani's Whisk & Bakes — PRD

## Original Problem Statement
Redesign and rebuild the single-file prototype at kanis-brownie-studio.vercel.app into a modern, mobile-first bakery web app with a real backend, proper admin dashboard, and cleaner brand experience.

## User Personas
- **Customer** (Chennai): browses menu, orders brownies/cakes/cookies/cupcakes, pays via UPI, tracks orders, optionally maintains an account with order history.
- **Kani (Admin)**: manages menu, kanban orders, reviews, expenses/P&L and broadcasts to customers.

## Tech Stack
- **Frontend**: React 19 + React Router + Tailwind CSS + Shadcn UI + qrcode.react + @dnd-kit + framer-motion
- **Backend**: FastAPI + Motor (async MongoDB) + PyJWT + bcrypt
- **Auth**: JWT (httpOnly cookie + Bearer localStorage fallback for cross-domain preview)
- **Palette**: Cocoa #3B2416, Cream #FBF3E4, Peach #F4B183, Gold #D4AF37
- **Fonts**: Playfair Display (H), Inter (UI), Poppins (body)

## Delivery / Business Rules
- Chennai-only, flat ₹50 delivery
- UPI payment (display QR + confirmation checkbox — no gateway integration yet)
- Twilio WhatsApp notifications MOCKED (backend logs)

## What's Implemented (v1, Feb 2026)
- Customer storefront: cinematic hero, USP strip, category tiles, featured products, story, testimonials
- Menu grid with category filters (all/brownies/cakes/cookies/cupcakes/eggless)
- Premium product cards with badges, star ratings, quantity stepper, Add-to-cart
- Sticky cart FAB + slide-in cart drawer (Shadcn Sheet)
- Checkout: prefills for logged-in users, 10-digit phone validation, UPI QR (qrcode.react), payment-confirmed checkbox, order summary
- Order tracking page with status timeline
- Customer login/register + `/orders` history
- Admin dashboard: KPI strip, Kanban with @dnd-kit drag-and-drop across 5 statuses, Menu manager (CRUD), Reviews moderation, Expenses log with quick P&L, WhatsApp broadcast (mocked)
- SEO tags, OG image, favicon (inline SVG), brand meta
- 12 seeded products + 3 approved reviews
- 32/32 backend tests passing (products, auth, orders lifecycle, reviews, expenses, stats, broadcast, admin gating)

## Prioritized Backlog
### P0 (blocking for real launch)
- Real Twilio WhatsApp credentials (currently MOCKED — logs to backend)
- Product image uploads (object storage) — v1 uses image URLs
- Real product photography (currently uses curated placeholders)

### P1 (nice for v1.1)
- Payment reconciliation flow (verify UPI transaction reference before dispatch)
- Email receipts via Resend
- Delivery zone / pincode-based ETAs
- Coupon codes / referral

### P2 (later)
- Multi-admin (staff accounts with limited permissions)
- Analytics dashboard (weekly revenue, best sellers)
- SMS OTP for customer login
- PWA install (offline menu)

## Next Session Ideas
- Wire real Twilio credentials → verify order confirmations & broadcasts hit WhatsApp.
- Add file upload API (object storage) and swap the "image URL" input in Admin Menu Manager with an uploader.
- Introduce a coupon/promo system driven by Kani's broadcast pushes.
