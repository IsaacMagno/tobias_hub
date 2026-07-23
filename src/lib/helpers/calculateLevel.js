export function calculateLevel(xp, limiar = 35) {
  return Math.floor(Math.sqrt(xp / limiar));
}

export function calculateXP(nivel, limiar = 35) {
  return Math.pow(nivel, 2) * limiar;
}
