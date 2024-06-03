export type RawBet = {
  bet_type: BetType;
  bet_value: number;
  dice_value: number;
  multiplier: number;
  is_winner: boolean;
};

export enum BetType {
  Under = 0,
  Over,
}

export type FormattedBet = {
  betType: "under" | "over";
  betValue: number;
  diceValue: number;
  multiplier: number;
  isWinner: boolean;
  txHash?: string;
};
