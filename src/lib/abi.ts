export const abi = JSON.stringify({
  types: {
    Bet: {
      type: "struct",
      fields: [
        {
          name: "bet_type",
          type: "u32",
        },
        {
          name: "bet_value",
          type: "u32",
        },
        {
          name: "dice_value",
          type: "u32",
        },
        {
          name: "multiplier",
          type: "u32",
        },
        {
          name: "is_winner",
          type: "bool",
        },
      ],
    },
    BetType: {
      type: "enum",
      variants: [
        {
          name: "UNDER",
          discriminant: 0,
        },
        {
          name: "OVER",
          discriminant: 1,
        },
      ],
    },
  },
});
