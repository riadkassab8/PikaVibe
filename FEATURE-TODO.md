# Home Goods — Feature Implementation Checklist

## Goal
Improve the storefront and admin dashboard without replacing the existing architecture or visual language.

## Phase 1 — Storefront usability

- [x] Show each cart line item's total price (`unit price × quantity`) clearly.
- [x] Close the navbar section dropdown automatically after selecting a section.
- [x] Show an explicit **Out of stock** state on product cards and product details when stock reaches zero.
- [x] Prevent adding unavailable products to the cart.

## Phase 2 — Category management

- [x] Add a database-backed categories table.
- [x] Add admin-protected category list/create/update/delete endpoints.
- [x] Add category CRUD controls in the admin dashboard.
- [x] Use active categories in the storefront navigation and product form.
- [x] Prevent deleting a category that is still used by products, or provide a safe replacement flow.

## Phase 3 — Discounts and offers

- [x] Add discount fields and validation to products or a dedicated discounts model.
- [x] Support percentage discounts with optional start/end dates.
- [x] Ensure the server calculates the effective price and never trusts client totals.
- [x] Add an Offers/Discounts section to the homepage.
- [x] Add admin controls to create, edit, activate, and deactivate offers.
- [x] Show original price, discount percentage, and final price in storefront, cart, checkout, and receipts.

## Phase 4 — Admin order visibility

- [x] Make Recent orders rows open the detailed Orders management view.
- [x] Show customer, address, phone, products, variants, quantities, prices, subtotal, shipping, total, payment, and status.
- [x] Keep the real-time new-order notification connected to the detailed order view.

## Phase 5 — Verification

- [x] Run frontend and backend TypeScript checks.
- [x] Build frontend and backend.
- [x] Test cart line totals after quantity changes.
- [x] Test dropdown auto-close in the source build.
- [x] Test category CRUD end to end through the live API.
- [x] Test discount activation and server-side order pricing through the live API.
- [x] Test out-of-stock display and add-to-cart prevention in the source build.
- [x] Test Recent orders details and new-order flow through the existing API/SSE implementation.

## Notes

The current architecture remains React + Vite + Express + Drizzle + PostgreSQL. Existing authentication, guest checkout, SSE notifications, and UI styling should be reused rather than rebuilt.

**Implementation order:** complete and test each phase before moving to the next phase.

