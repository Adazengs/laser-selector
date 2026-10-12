# Visual verification and screenshot delivery

Use the browser controls available in the current agent environment. Read their
documentation before use. The selectors below come from this project's HTML; the
rendered uppercase labels are CSS and may differ from DOM text.

## Verify the source

1. Start `npm run preview` and use the URL printed by that process.
2. Read `/__preview`; compare its SHA-256 with `index.html` and confirm
   `project: laser-selector`. Confirm the page title is `Filter Selector | Univet Laser`.
3. If the page differs, resolve the mismatch before testing. Record cache/service-worker
   explanations as hypotheses until directly observed. Check the live URL separately after publishing.

## Exercise both modes

- Multiple Wavelength: `#mode-multi-btn`; Range is the second `.sr-btn` in
  `#multi-rows`. Enter 190 and 1065, select OD 5, then `#btn-multi-next`.
  Expect 0 matches and all three paragraphs of empty-result guidance.
- Edit criteria to 1060–1065. OD 5 stays selected; currently 16 filters match.
- Quick Guide: `#mode-quick-btn`; select `.laser-chip[data-id="fiber"]`,
  choose OD 5 in `#quick-rows`, then `#btn-quick-next`. Expect matching filters.
- Also check Er:YAG / OD 9 and Single/Range switching: OD remains selected and
  the result is empty. Confirm the result view in a 390px-wide viewport.

## Capture and deliver

Capture the completed result view with the entered range, OD, match count and
entire guidance visible. Use a full-page screenshot or scroll to the result;
inspect the image before closing the tab. Save it to the task's durable artifact
directory, then embed it with `![description](/absolute/path/result.jpg)` in the
final reply. Restore temporary viewport overrides, close task-created tabs and stop
the preview server after saving the evidence.

With Codex CUA, after obtaining a tab through the documented entry point:

```js
// screenshotPath is an absolute path in the task's existing artifact directory.
const bytes = await tab.screenshot({ fullPage: true });
await (await import('node:fs/promises')).writeFile(screenshotPath, bytes);
await nodeRepl.emitImage(bytes);
```

Use this only when the current tool documentation supports these APIs. Other
environments should use their own documented capture/save methods. Tool-output
images alone do not replace the image embedded in the final reply.
