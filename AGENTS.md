# Project architecture rules

- Keep every template pop-up's editable title, photo requirement, and details requirement as one explicit record in `SITE.templateInfo`; this prevents hidden shared copy and keeps future templates easy to add.
- Keep every Memory Card design's editable name, description, photo requirement, and details requirement in one explicit `SITE.memoryCardInfo` record; this keeps client edits centralized.