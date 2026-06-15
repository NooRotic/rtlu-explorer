// src/ui/menuItems.js
// Pure: given the right-click target node (or null for empty background), return the
// wu-menu rows. App-chrome verbs live here (not theme.copy) — they are UI actions, not
// artist voice. A row is either { id, label, accent? } or { divider: true }.
export function menuItemsFor(node) {
  if (!node) return [{ id: 'reset', label: 'Reset view', accent: true }];
  return [
    { id: 'isolate', label: 'Isolate connections' },
    { id: 'dossier', label: 'Open dossier' },
    { id: 'fly', label: 'Fly to' },
    { id: 'copy', label: 'Copy name' },
    { divider: true },
    { id: 'reset', label: 'Reset view', accent: true },
  ];
}
