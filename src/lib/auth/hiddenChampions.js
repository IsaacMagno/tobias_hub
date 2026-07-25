/** Contas que não aparecem em Campeões / perfil público. */
export const HIDDEN_CHAMPION_USERNAMES = new Set(["admin"]);

export function isHiddenUsername(username) {
  return HIDDEN_CHAMPION_USERNAMES.has(
    String(username || "")
      .trim()
      .toLowerCase()
  );
}
