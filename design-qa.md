# Design QA — desktop header

- Source visual truth: `.design-qa-header-source.png`
- Implementation screenshot: `.design-qa-header-implementation.png`
- Combined focused comparison: `.design-qa-header-comparison.png`
- Source pixels: 1910 × 788
- Implementation pixels: 1280 × 720
- Tested CSS viewport: desktop browser viewport (browser capture constrained to 1280 × 720)
- Density normalization: source scaled to 1280 px width; source header cropped to 69 px, implementation header cropped to 73 px
- State: home page, top of page, logged out, default navigation state

## Full-view comparison evidence

The implementation screenshot confirms that the desktop header is a single horizontal row overlaying the hero. The hero composition, search field, and filter remain unobstructed. The mobile header markup was not changed.

## Focused region comparison evidence

The combined comparison places the normalized original two-row header directly above the implemented one-row header. Logo, navigation, stories entry, favorites, add-listing action, and login action remain present and aligned in one row. The implemented background allows the hero sky color through while retaining readable contrast through backdrop blur.

## Required fidelity surfaces

- Fonts and typography: existing Manora font stack and weights preserved; labels remain legible without wrapping.
- Spacing and layout rhythm: one 72 px desktop row; consistent horizontal gaps and centered vertical alignment.
- Colors and visual tokens: Manora green/yellow actions preserved; translucent white glass surface matches the requested treatment.
- Image quality and asset fidelity: existing vector Manora logo retained without replacement.
- Copy and content: all existing navigation and account actions retained.

## Findings

No actionable P0, P1, or P2 differences remain for the requested header change.

## Interaction checks

- Header links and buttons remain semantic links/buttons.
- Header stays fixed over the desktop home hero.
- Other desktop routes retain sticky behavior.
- Mobile layout remains on its existing responsive structure.
- Browser console errors: none.
- Measured desktop header height: 73 px; logo, navigation, stories, and actions share the same row.

## Comparison history

1. Initial source: two opaque white rows, totaling roughly 102 px at the original width.
2. Fix: combined logo, navigation, stories, and actions into one translucent 72 px desktop row; positioned it over the home hero.
3. Post-fix evidence: `.design-qa-header-implementation.png` and `.design-qa-header-comparison.png` show the final one-row glass header with no overlap or wrapping.

final result: passed

---

# Design QA — tab icons and four-item primary filter row

- Source visual truth: `.design-qa-home-filter-four-items-source.png`
- Browser-rendered implementation: `.design-qa-home-filter-four-items.png`
- Expanded-filter state: `.design-qa-home-filter-four-items-open.png`
- Focused comparison: `.design-qa-home-filter-four-items-comparison.png`
- Source pixels: 1293 × 325
- Implementation pixels and CSS viewport: 1280 × 720 at 1:1 density
- State: desktop home, `Недвижимость + Купить`, collapsed and expanded advanced filters

## Comparison evidence

The focused comparison normalizes the source and implementation filter regions to 1200 px. The implementation preserves the supplied two-row card while adding real Lucide icons to all four tabs and moving `Все фильтры` into the primary row. The lower row now contains exactly four controls: category, city, advanced filters, and search.

## Required fidelity surfaces

- Fonts and typography: existing 14 px tab and control labels remain complete with no truncation or wrapping.
- Spacing and layout rhythm: the tab row is lighter without the detached right-side action; the four lower grid tracks preserve clear category and city widths while keeping both actions compact.
- Colors and tokens: selected mint tabs and the solid Manora-green search button retain the established hierarchy; the secondary filter action uses a neutral bordered surface.
- Image and icon quality: hero imagery remains unchanged; standard Lucide icons are rendered at a consistent 17–18 px with no custom or placeholder artwork.
- Copy and content: all requested tab labels and the four lower control labels are present.

## Interaction and accessibility checks

- Tab semantics and `aria-selected` remain intact; decorative tab icons are hidden from assistive technology.
- `Все фильтры` retains `aria-expanded`, opens its anchored popover, and exposes a dedicated close action.
- Browser console errors: none.

## Findings and comparison history

1. Source state had text-only tabs and only three controls in the lower row (requested change, P2).
2. Icons were added to every tab and `Все фильтры` was moved into a four-track lower grid.
3. Post-fix comparison shows complete labels, consistent icon weight, and no actionable P0, P1, or P2 findings.

final result: passed

---

# Design QA — unified desktop home filter

- Source visual truth: `.design-audit-home-filter-layout-source.png`
- Final collapsed state: `.design-qa-home-filter-unified.png`
- Final expanded state: `.design-qa-home-filter-unified-open.png`
- Combined comparison: `.design-qa-home-filter-unified-comparison-small.png`
- Source pixels: 1605 × 557
- Implementation pixels and CSS viewport: 1604 × 550 at 1:1 density
- States: `Недвижимость + Купить`, collapsed and expanded advanced filters

## Full-view and focused comparison evidence

The combined image places the supplied layout above the final browser capture. The source has a detached segmented control and a nearly full-width primary filter row. The final state groups both decision levels into one centered 1180 px card. Labels, icons, field boundaries, and action hierarchy are readable in the normalized comparison, so an additional crop is not needed.

## Required fidelity surfaces

- Fonts and typography: existing Manora type scale and weights remain intact; labels do not truncate at the tested viewport.
- Spacing and layout rhythm: related controls share one 26 px-radius card; compact tabs form the first row and the three primary controls form the second row.
- Colors and tokens: pale mint communicates selected tabs while solid Manora green remains reserved for the primary search action.
- Image quality: the supplied desktop hero and existing vector icons remain unchanged and sharp.
- Copy and content: `Недвижимость`, `Авто`, `Купить`, `Арендовать`, `Все фильтры`, category, location, and search labels remain present.

## Interaction and runtime checks

- Catalog and deal controls retain tab semantics and selected states.
- `Все фильтры` is a labelled button with `aria-expanded`.
- The expanded panel is absolutely positioned below the card, has a dedicated close action, and does not alter the hero layout flow.
- Browser console errors: none.

## Comparison history

1. Initial source had detached tabs, excessive horizontal spread, and an ambiguous icon-only advanced-filter action (P2).
2. First unified-card pass fixed grouping and action labelling, but the expanded panel was still in normal flow and shifted the hero composition (P2).
3. The panel was converted to an anchored popover. Post-fix collapsed and expanded captures show stable layout and clear hierarchy.

No actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — scroll-aware desktop header blur

- Top state: `.design-qa-header-scroll-top.png`
- Scrolled state: `.design-qa-header-scroll-scrolled.png`
- Focused comparison: `.design-qa-header-scroll-comparison.png`
- Viewport and pixels: 1280 × 720 at 1:1 density

## Checks

- At scroll position 0 the desktop home header uses 24% white and a measured 3 px backdrop blur, allowing the hero background to remain visible.
- After scrolling it transitions to 60% white and a measured 24 px blur for navigation readability over page content.
- The transition covers background, blur, border, and shadow over 300 ms.
- Header typography, spacing, logo, actions, and copy remain unchanged.
- Returning to the top restores the low-blur state; browser console errors: none.

final result: passed

---

# Design QA — reduced desktop header opacity

- Source visual truth: `.design-qa-header-opacity-source.png`
- Final implementation: `.design-qa-header-opacity-final.png`
- Focused comparison: `.design-qa-header-opacity-comparison.png`
- Source pixels: 1910 × 683
- Implementation pixels and CSS viewport: 1910 × 700 at 1:1 density
- State: desktop home, top of page

## Evidence and checks

- Desktop header opacity changed from 72% white to 45% white; blur changed from 2xl to xl and the shadow/border were softened.
- The city image and warm sky are visibly present behind the header while dark navigation copy retains clear contrast.
- Header height, one-row alignment, typography, logo and action assets, navigation copy, and interaction targets are unchanged.
- Focused comparison uses equal-width header crops; no actionable P0, P1, or P2 differences remain.
- Browser console errors: none.
- Mobile retains its existing 95% white header surface.

final result: passed

---

# Design QA — lightweight two-level home filter

- Source visual truth: `.design-audit-filter-tabs-heavy.png`
- Final implementation: `.design-qa-filter-tabs-clean.png`
- Combined comparison: `.design-qa-filter-tabs-clean-comparison.png`
- Source pixels: 1644 × 184
- Implementation pixels and CSS viewport: 1280 × 720 at 1:1 density
- State: Недвижимость + Купить selected

## Evidence and findings

- The supplied source shows four truncated, icon-heavy tabs competing with the category and city fields in one dense row.
- The final implementation moves both tab groups into one centered lightweight panel above the main search row.
- Category and city controls now have enough width, and every label is visible without wrapping or truncation.
- The mint selected state preserves Manora branding while leaving the solid green search button as the primary action.
- Typography, spacing, colors, hero imagery, icons in the remaining fields, and all app-specific copy were checked in the combined comparison.

## Interaction checks

- Real-estate rent becomes selected on one click.
- Switching to cars selects `Авто`, returns the deal to `Купить`, disables unsupported car rental, and changes the category prompt.
- Both controls retain tab semantics and selected-state accessibility attributes.
- Browser console errors: none.

## Comparison history

1. Source state had truncated text and an overloaded single-row hierarchy (P2).
2. Tab controls were separated from the search fields, icons removed, and the selected color reduced to a mint tint.
3. The final screenshot shows complete labels and a clear two-level hierarchy; no actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — rounded clickable desktop filters

- Supplied reference: `.design-qa-filter-rounded-source.png`
- Final closed state: `.design-qa-filter-rounded-closed.png`
- Final open state: `.design-qa-filter-rounded-open.png`
- Focused comparison: `.design-qa-filter-rounded-comparison.png`
- Source pixels: 1506 × 195
- Tested viewport: 1280 × 720 desktop

## Requested changes verified

- The filter shell and every control use clearly rounded corners; the advanced-filter and search actions follow the same radius system.
- The first control is now a full-width semantic dropdown button: clicking its visible text opens the list on the first click and does not place a text caret.
- The first list contains only `Недвижимость` and `Авто`.
- The deal control contains `Купить` and `Арендовать`; car mode correctly keeps the supported purchase flow selected.
- Changing to `Авто` updates the dependent category placeholder to `Категория авто`.
- City remains the only searchable primary field. Query `Худ` returns `Худжанд`.
- Grid proportions were rebalanced so `Недвижимость`, `Тип недвижимости`, and `По всему Таджикистану` remain readable at 1280 px.

## Runtime checks

- First-click open, option selection, dependent-state update, and city search passed in the browser.
- No runtime errors were produced by the filter flow; the dev server reports only pre-existing Next Image sizing warnings outside this change.
- Lint, 67 automated tests, TypeScript, and the production build passed.

final result: passed

---

# Design QA — vertically centered desktop hero content

- Source state: `.design-qa-filter-closed.png`
- Implementation screenshot: `.design-qa-filter-centered.png`
- Combined comparison: `.design-qa-filter-centered-comparison.png`
- Viewport: 1280 × 720 desktop
- Requested delta: vertically center the headline, supporting copy, and input block as one composition

## Comparison evidence

The same viewport is shown side by side. In the source state, the copy sits near the top while the filter is pinned to the bottom edge. In the implementation, both elements form a single centered stack with a consistent 24 px separation between the copy and the form.

## Checks

- Headline, supporting copy, and filter remain horizontally centered.
- The complete group is vertically centered in the hero area below the 72 px overlay header.
- The filter stays in one row at 1280 px and all primary labels remain visible.
- Hero imagery, header, mobile layout, filter behavior, and routing are unchanged.
- Browser console errors: none.

## Findings

No actionable P0, P1, or P2 differences remain for the requested alignment change.

final result: passed

---

# Design QA — desktop home filter

- Source visual truth: `.design-qa-filter-source.png`
- Implementation screenshots: `.design-qa-filter-closed.png`, `.design-qa-filter-city-open.png`
- Combined focused comparison: `.design-qa-filter-comparison.png`
- Source pixels: 1460 × 251
- Implementation pixels: 1280 × 720
- Tested CSS viewport: 1280 × 720 desktop
- Density normalization: source filter cropped and scaled to 1280 px; implementation filter cropped at native 1280 px width
- States: default filter, city menu open, city search, selected city, submitted filter

## Full-view comparison evidence

The full implementation capture confirms that the filter remains anchored at the bottom of the desktop hero without obscuring the headline or primary image composition. The custom controls keep the compact single-row structure of the supplied reference while adding identifiable icons.

## Focused region comparison evidence

The focused comparison places the normalized supplied filter above the implementation. Field order, white container, separators, green filter action, and primary search button match the reference. Native selects are replaced by searchable custom comboboxes with category-specific icons and active-state feedback.

## Required fidelity surfaces

- Typography: compact 14 px field labels remain readable at 1280 px without truncating the city label.
- Layout rhythm: four flexible fields, compact advanced-filter control, and primary action remain in one row.
- Colors: Manora green is used for icons, active states, and the search action; neutral borders preserve the reference hierarchy.
- Content: catalog, deal type, category, and country-wide city choice remain intact.
- Responsive scope: the requested redesign is isolated to the desktop hero; mobile behavior is unchanged.

## Interaction checks

- City menu priority: Душанбе, Худжанд, Бохтар, Вахдат, Хисор, then remaining API cities alphabetically.
- City search query `Худ` returns only `Худжанд`.
- Selecting Худжанд and submitting navigates to `/listings?...&location_id=21...`.
- Comboboxes expose accessible labels, options, selected state, and keyboard-compatible Headless UI behavior.
- Empty city search has the dedicated message `Город не найден`.
- Browser console errors: none.
- Backend gap: the current `/locations` response has no canonical Рудаки entry; the required API work is documented in `audit/2026-08-10/backend-home-locations-rudaki-prompt.md`.

## Comparison history

1. Initial implementation used visually plain select controls with no category cues.
2. First pass introduced icon-based searchable comboboxes and ordered city results.
3. Visual QA found the country-wide label clipped at 1280 px; grid widths and desktop field typography were adjusted.
4. Final evidence confirms the complete label, clear iconography, city search, selection, and submitted query behavior.

final result: passed

---

# Design QA — segmented catalog and deal tabs

- Source visual truth: `.design-qa-filter-rounded-closed.png`
- First implementation: `.design-qa-filter-tabs-default.png`
- Final implementation: `.design-qa-filter-tabs-final.png`
- Focused before/after comparison: `.design-qa-filter-tabs-comparison.png`
- Source and implementation pixels: 1280 × 720
- CSS viewport: 1280 × 720 desktop, density normalized 1:1
- State: Недвижимость + Купить selected

## Full-view comparison evidence

The final capture preserves the single-row filter, centered hero composition, translucent header, imagery, and existing search controls. The catalog and deal selectors are replaced by two visually distinct segmented tab groups with Manora green active states.

## Focused region comparison evidence

The combined crop shows the previous dropdown controls above and the final tab controls below at the same width. All four tab labels are fully visible, the active choice has clear contrast and elevation, and the remaining category, city, advanced-filter, and search controls stay aligned in one row.

## Required fidelity surfaces

- Typography: 13 px semibold tab labels remain readable without wrapping or truncation.
- Spacing and layout rhythm: asymmetric tab widths give long labels enough space while preserving the 60 px filter height and rounded 24 px shell.
- Colors and tokens: selected tabs use Manora green; inactive tabs use the existing pale-green neutral surface and accessible dark text.
- Image quality: the supplied desktop hero and brand assets are unchanged.
- Copy and content: `Недвижимость`, `Авто`, `Купить`, and `Арендовать` are all visible at once.

## Interaction checks

- `Арендовать` becomes selected on one click for real estate.
- Selecting `Авто` automatically returns the deal to `Купить`, disables unsupported car rental, and changes the category prompt to `Категория авто`.
- Tab groups expose `tablist`, `tab`, and `aria-selected` semantics.
- Browser console errors: none.

## Comparison history

1. First pass used equal tab widths; visual QA found `Недвижимость` and `Арендовать` truncated at 1280 px (P2).
2. The tab proportions and overall grid tracks were rebalanced.
3. Final evidence shows all tab, category, and city labels without truncation; no actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — expanded senior home filters

- Source visual truth: `.design-qa-home-filter-expanded-source.png`
- Final collapsed state: `.design-qa-home-filter-senior-closed-final.png`
- Final expanded state: `.design-qa-home-filter-senior-open-fixed.png`
- Focused comparison: `.design-qa-home-filter-senior-comparison.png`
- Source pixels: 1249 × 183
- Implementation pixels and CSS viewport: 1280 × 720 at 1:1 density
- States: property purchase, main filters collapsed and expanded

## Comparison evidence

The normalized comparison places the supplied filter above the final implementation. The original two main selects remain prominent, while a third context-aware select adds room count without weakening the city or category labels. The expanded browser capture shows five clearly grouped range controls: price, area, rooms, floor, and construction year.

## Required fidelity surfaces

- Fonts and typography: all main labels remain readable at 1280 px; the shorter `Комнаты` label removes the earlier truncation.
- Spacing and layout rhythm: five primary grid tracks fit in one row; advanced parameters use a three-column range-card grid and a 980 px popover.
- Colors and tokens: the existing mint selected state, neutral secondary action, white surfaces, and Manora-green primary action remain consistent.
- Image and icon quality: the original hero remains unchanged; existing Lucide icons are used consistently for every field group.
- Copy and content: property type, country-wide city, rooms, all filters, and search remain present; expanded filters use explicit units.

## Interaction and data-flow checks

- Selecting `2 комнаты` and searching navigates with `roomsFrom=2&roomsTo=2`.
- Selecting `Квартира` and `Душанбе` navigates with `propertyTypes=1&cities=20`; this also fixes the earlier query-key mismatch.
- Entering area from `60` and floor to `9` navigates with `areaFrom=60&floorTo=9`.
- Car mode exposes year presets and advanced price, year, and mileage ranges.
- All numeric range inputs have explicit accessible names; `Все фильтры` retains `aria-expanded` and a close action.
- Browser console errors: none.

## Comparison history

1. Initial source had only category, city, advanced action, and search; the user requested more useful filters (P2).
2. First expanded pass added rooms and five advanced range groups, but the room placeholder truncated (P2) and the popover was clipped by the hero boundary (P1).
3. The placeholder was shortened to `Комнаты`; the hero now establishes a visible, elevated overlay context so the complete popover stays above following content.
4. Final browser evidence shows complete labels and the entire expanded panel with no actionable P0, P1, or P2 findings.

final result: passed

---

# Design QA — transparent desktop filter glass

- Source visual truth: `.design-qa-home-filter-transparency-source.png`
- Final collapsed state: `.design-qa-home-filter-transparency-final.png`
- Final expanded state: `.design-qa-home-filter-transparency-open.png`
- Focused comparison: `.design-qa-home-filter-transparency-comparison.png`
- Source pixels: 1314 × 296
- Implementation pixels and CSS viewport: 1280 × 720 at 1:1 density
- State: desktop property purchase filter, collapsed and expanded

## Comparison evidence

The normalized focused comparison shows the original opaque white card above the final glass treatment. In the final state, the sunset, buildings, and car remain visible through the card while each control retains a separate readable surface.

## Required fidelity surfaces

- Fonts and typography: text size, weight, wrapping, and contrast remain unchanged and readable over the glass surface.
- Spacing and layout rhythm: dimensions, grid tracks, radii, and alignment are unchanged; only surface opacity, blur, border, and shadow changed.
- Colors and tokens: card white is 68%, field white is 78%, inactive secondary action white is 64%, and the primary search action remains solid Manora green.
- Image quality: the original hero image is more visible through the filter without changing its crop or sharpness.
- Copy and content: all tab and filter labels remain present with no truncation.

## Interaction and runtime checks

- Collapsed and expanded states render correctly.
- Expanded parameters use an 88% white glass popover for stronger long-form readability.
- Measured card style: 68% white background, 55% white border, and 12 px backdrop blur.
- Browser console errors: none.

## Findings

The source card was more opaque than requested (P2). The final glass hierarchy increases background visibility without sacrificing control contrast. No actionable P0, P1, or P2 findings remain.

final result: passed
