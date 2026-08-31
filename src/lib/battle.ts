export function rollAttack(): number {
  return Math.floor(Math.random() * 10);
}

export interface RoundResult {
  playerRoll: number;
  enemyRoll: number;
  playerAttack: string;
  enemyAttack: string;
  damage: number;
  heal: number;
  winner: "player" | "enemy" | "tie";
}

export function resolveRound(
  playerRoll: number,
  enemyRoll: number,
  playerAttack: string,
  enemyAttack: string
): RoundResult {
  if (playerRoll > enemyRoll) {
    const damage = playerRoll - enemyRoll;
    const heal = Math.ceil(damage / 2);
    return {
      playerRoll,
      enemyRoll,
      playerAttack,
      enemyAttack,
      damage,
      heal,
      winner: "player",
    };
  }

  if (enemyRoll > playerRoll) {
    const damage = enemyRoll - playerRoll;
    return {
      playerRoll,
      enemyRoll,
      playerAttack,
      enemyAttack,
      damage,
      heal: 0,
      winner: "enemy",
    };
  }

  return {
    playerRoll,
    enemyRoll,
    playerAttack,
    enemyAttack,
    damage: 0,
    heal: 0,
    winner: "tie",
  };
}