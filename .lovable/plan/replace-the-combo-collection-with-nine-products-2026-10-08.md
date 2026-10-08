# Replace the combo collection with nine products

## What will change

- Remove the three existing combos and replace them with Combo 01–09 from the supplied PDF.
- Use `COMBO_01.jpg` through `COMBO_09.jpg` and keep a strict three-column grid on phones and laptops.
- Give every combo an editable record containing its name, description, photo requirement, detail requirement, included items, and ideal occasions.
- Keep the current image preview and selection treatment, adapted for nine compact cards.

## Selection behavior

- Selecting a combo will add its exact included products and quantities from the PDF at no additional cost; only the combo row carries the price.
- “Photo Card” will use Memory Card designs; “Single/Duo Card” will use Friendship Card designs.
- Where a design says “Any 1/2,” the first available design will be selected automatically and customers can change it afterward.
- Magazine and Pocket Magazine template requirements remain active so customers can choose their layouts before checkout.
- Free Postcards will be represented as included free items.

## Cart and documents

- Show included combo products as a sublist beneath the combo in the cart and invoice, never as separate ₹0 rows.
- Keep Memory Card designs beneath the main Memory Card invoice row.
- Show Gift Wrap by name on shipping labels when included or selected.
- Save PDFs as `<customername>_<invoicenumber>_invoice.pdf` and `<customername>_<invoicenumber>_shippinglabel.pdf`, with unsafe filename characters removed.

## Verification

- Test all nine recipes, prices, quantities, automatic card picks, replacement/removal, totals, and persistence.
- Check the phone and laptop grids, detail pop-ups, cart grouping, invoice output, and shipping summary.
- Fix the existing Memory Card banner type error and confirm a clean build.

## Technical details

- Extend the central price, catalogue recipe, content, store, cart, and Apps Script document formatting records.
- Preserve existing backgrounds, SVG utility classes, and route structure. 