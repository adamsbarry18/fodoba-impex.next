/** Ouvre une modale après fermeture du menu Radix (évite les overlays bloquants). */
export function openDialogAfterMenuClose(action: () => void) {
  window.setTimeout(action, 0)
}
