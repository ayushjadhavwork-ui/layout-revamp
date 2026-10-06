&nbsp;

# Replace template descriptions from the customer guide

## Changes

- Replace the current shared description, “What’s included,” note, and other template-detail copy with one exact entry for each of Templates 01–35 from the supplied PDF.
- Keep only the PDF’s template name, photo requirement, and details requirement in each template pop-up.
- Remove the generic “Included” heading and all inherited/fallback marketing text so no extra copy appears.
- Preserve the existing template image, selection controls, reviews, backgrounds, and navigation.

## Technical details

- Simplify the editable template information in `site-content.ts` to 35 explicit records.
- Update the template detail pop-up to render only those three fields.
- Verify all 35 records exist, then check the site build and one rendered pop-up.
- also make sure the tpls remain very easy to edit and also when new templates are added one can easily add and  edit it's description form the site contents file itself.