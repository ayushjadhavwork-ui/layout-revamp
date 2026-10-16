# Roadmap

- [x] Replace 3 combos with the 9 PDF-defined combos and images.
- [x] Add editable combo details and responsive 3×3 presentation.
- [x] Make every combo recipe select all included products and quantities.
- [x] Keep combo-owned strips/cards linked when customers adjust optional included designs (strips swap the oldest pick at the combo limit).
- [x] Require all combo-included products before checkout; do not auto-select Photo or Friendship Cards or strips.
  - Cart drawer lists every missing item and disables Checkout; the page's "Complete my order" shows a toast and scrolls to the first missing section.
  - Shared rule: `comboCheckoutIssues` (combo-validation.ts) via `useComboIssues` (store.ts), including combo magazine/pocket templates.
- [x] Group combo and Memory Card details in cart/invoice output.
  - Invoice: exact format + pages (Standard Magazine A4 / Mini Magazine A5 / Pocket Magazine A6 / Newspaper Magazine Broadsheet A4 Spreads); combo contents as ↳ Format / Templates / Card Designs / Polaroid Strips / Polaroids / Add-ons.
- [x] Update shipping labels and document filenames (`<name>_<invoice>_invoice.pdf`, `<name>_<invoice>_shippinglabel.pdf`).
- [x] Complimentary Keepsake Postcard in every cart with a paid item — protected in the drawer, ₹0 row on invoice and label.
- [x] Preferred delivery date (min today + 4) in the checkout popup; logged to Cart Logs and Completed Orders only, never on invoice/label.
- [x] Fix: strips, Friendship Cards and Memory Cards were ₹0 beside *any* combo. They're now free only when the combo's recipe includes them; otherwise they're a paid extra (normal price, no `comboId`) that survives deselecting the combo. Shared rule: `comboIncluding` (store.ts), tests in `store.test.ts` (`bun test src/lib`).
- [x] Remove OrderWaitTimeSection and ImageUploadSection from the home page.
- [x] Verify selection, documents, mobile/desktop presentation, and build.
- [ ] Redeploy `code.gs` in Apps Script so the new sheet column and invoice/label wording go live.
