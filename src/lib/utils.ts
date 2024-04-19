import { BetType, FormattedBet, RawBet } from "@/@types/bet";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

export function betTypeToString(betType: BetType) {
  return betType === BetType.Under ? "under" : "over";
}

export function betTypeToNumber(betType: FormattedBet["betType"]): BetType {
  return betType === "under" ? BetType.Under : BetType.Over;
}

export function convertBet(bet: RawBet): FormattedBet {
  return {
    betType: betTypeToString(bet.bet_type),
    betValue: bet.bet_value,
    diceValue: bet.dice_value,
    multiplier: bet.multiplier,
    isWinner: bet.is_winner,
  };
}

export function convertBetToJSON(bet: RawBet[]) {
  return bet.map(convertBet);
}
