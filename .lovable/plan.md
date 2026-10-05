# Add the Memory Card category

## What will be built
- Add a new **The Memory Card** section directly below Newspaper Magazine and before Friendship Card.
- Use `CARD.webp` as the full promotional banner.
- Show three designs from the supplied Birthday, Friendship, and Lover image pairs.
- On phones, keep two designs on the first row and center the third below; on laptops, keep all three in one row.

## Product selection and pricing
- Let customers mix any three cards, or choose up to three copies of one design.
- Use simple **Select**, then **− / Qty ×N / +** controls, capped at three cards total.
- Apply the PDF’s bundle prices automatically: 1 card ₹150, 2 cards ₹220, 3 cards ₹300.
- Add front/back swipeable detail views for each design.

## Editable information
- Add one clear `SITE.memoryCardInfo` record per design with editable name, description, photos required, and details required.
- Populate all three records strictly from the supplied PDF.
- Add the banner and six design images through the project’s managed media flow.

## Cart, checkout, and documents
- Represent the selection as one priced Memory Card bundle with the chosen design quantities listed underneath.
- Require the selected quantity to be complete before checkout.
- Update invoice output to show the bundle quantity, correct tier rate, and selected designs/quantities.
- Update the shipping label to include **Memory Card × quantity** without printing customisation details.
- Update the non-coder guide for changing Memory Card images, descriptions, and prices.

## Verification
- Test selecting mixed designs and three copies of one design, plus/minus limits, cart totals, removal, persistence, and checkout validation.
- Visually verify the section and detail pop-ups at phone and laptop sizes.
- Check the app build and document-generation logic for errors.

## Technical details
- Extend the catalogue/category types, central price file, persisted store state, cart summaries, and Apps Script invoice/shipping formatters.
- Keep existing backgrounds, SVG utility classes, and routing unchanged.
