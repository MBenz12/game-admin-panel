export type Slots = {
  "version": "0.1.0",
  "name": "slots",
  "instructions": [
    {
      "name": "createGame",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "tokenMint",
          "type": "publicKey"
        },
        {
          "name": "communityWallets",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "royalties",
          "type": {
            "vec": "u16"
          }
        },
        {
          "name": "commissionWallet",
          "type": "publicKey"
        },
        {
          "name": "commissionFee",
          "type": "u16"
        },
        {
          "name": "betPrices",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "setCommunityWallet",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "communityWallet",
          "type": "publicKey"
        },
        {
          "name": "royalty",
          "type": "u16"
        }
      ]
    },
    {
      "name": "setCommission",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "commissionWallet",
          "type": "publicKey"
        },
        {
          "name": "commissionFee",
          "type": "u16"
        }
      ]
    },
    {
      "name": "setWinning",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "betPrices",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "winPercents",
          "type": {
            "vec": {
              "vec": "u16"
            }
          }
        },
        {
          "name": "jackpot",
          "type": "u64"
        },
        {
          "name": "minRoundsBeforeWin",
          "type": "u8"
        }
      ]
    },
    {
      "name": "addPlayer",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "play",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gameTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "commissionTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructionSysvarAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "betNo",
          "type": "u8"
        },
        {
          "name": "numberOfPlay",
          "type": "u16"
        }
      ]
    },
    {
      "name": "sendToCommunityWallet",
      "accounts": [
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gameTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "communityTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claim",
      "accounts": [
        {
          "name": "claimer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "claimerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gameTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructionSysvarAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "claimer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "claimerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gameTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fund",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gameTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "game",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "tokenMint",
            "type": "publicKey"
          },
          {
            "name": "royalties",
            "type": {
              "vec": "u16"
            }
          },
          {
            "name": "communityWallets",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "commissionWallet",
            "type": "publicKey"
          },
          {
            "name": "commissionFee",
            "type": "u16"
          },
          {
            "name": "mainBalance",
            "type": "u64"
          },
          {
            "name": "communityBalances",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "communityPendingBalances",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "jackpot",
            "type": "u64"
          },
          {
            "name": "winPercents",
            "type": {
              "vec": {
                "vec": "u16"
              }
            }
          },
          {
            "name": "betPrices",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "minRoundsBeforeWin",
            "type": "u8"
          },
          {
            "name": "loseCounter",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "player",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "publicKey"
          },
          {
            "name": "earnedMoney",
            "type": "u64"
          },
          {
            "name": "key",
            "type": "publicKey"
          },
          {
            "name": "status",
            "type": "u32"
          },
          {
            "name": "isJackpot",
            "type": "bool"
          },
          {
            "name": "equalNo",
            "type": "u32"
          },
          {
            "name": "equalCount",
            "type": "u32"
          },
          {
            "name": "multipler",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "UnauthorizedWallet",
      "msg": "Unauthorized wallet cannot create game"
    },
    {
      "code": 6001,
      "name": "MinimumPrice",
      "msg": "You should bet at least 0.05 sol"
    },
    {
      "code": 6002,
      "name": "InvalidInstructionAdded",
      "msg": "Invalid Instruction Added"
    },
    {
      "code": 6003,
      "name": "InvalidProgramId",
      "msg": "Invalid Program"
    }
  ]
};

export const IDL: Slots = {
  "version": "0.1.0",
  "name": "slots",
  "instructions": [
    {
      "name": "createGame",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "tokenMint",
          "type": "publicKey"
        },
        {
          "name": "communityWallets",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "royalties",
          "type": {
            "vec": "u16"
          }
        },
        {
          "name": "commissionWallet",
          "type": "publicKey"
        },
        {
          "name": "commissionFee",
          "type": "u16"
        },
        {
          "name": "betPrices",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "setCommunityWallet",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "communityWallet",
          "type": "publicKey"
        },
        {
          "name": "royalty",
          "type": "u16"
        }
      ]
    },
    {
      "name": "setCommission",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "commissionWallet",
          "type": "publicKey"
        },
        {
          "name": "commissionFee",
          "type": "u16"
        }
      ]
    },
    {
      "name": "setWinning",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "betPrices",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "winPercents",
          "type": {
            "vec": {
              "vec": "u16"
            }
          }
        },
        {
          "name": "jackpot",
          "type": "u64"
        },
        {
          "name": "minRoundsBeforeWin",
          "type": "u8"
        }
      ]
    },
    {
      "name": "addPlayer",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "play",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gameTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "commissionTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructionSysvarAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "betNo",
          "type": "u8"
        },
        {
          "name": "numberOfPlay",
          "type": "u16"
        }
      ]
    },
    {
      "name": "sendToCommunityWallet",
      "accounts": [
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gameTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "communityTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claim",
      "accounts": [
        {
          "name": "claimer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "claimerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gameTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructionSysvarAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "claimer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "claimerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gameTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fund",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gameTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "game",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "tokenMint",
            "type": "publicKey"
          },
          {
            "name": "royalties",
            "type": {
              "vec": "u16"
            }
          },
          {
            "name": "communityWallets",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "commissionWallet",
            "type": "publicKey"
          },
          {
            "name": "commissionFee",
            "type": "u16"
          },
          {
            "name": "mainBalance",
            "type": "u64"
          },
          {
            "name": "communityBalances",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "communityPendingBalances",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "jackpot",
            "type": "u64"
          },
          {
            "name": "winPercents",
            "type": {
              "vec": {
                "vec": "u16"
              }
            }
          },
          {
            "name": "betPrices",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "minRoundsBeforeWin",
            "type": "u8"
          },
          {
            "name": "loseCounter",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "player",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "publicKey"
          },
          {
            "name": "earnedMoney",
            "type": "u64"
          },
          {
            "name": "key",
            "type": "publicKey"
          },
          {
            "name": "status",
            "type": "u32"
          },
          {
            "name": "isJackpot",
            "type": "bool"
          },
          {
            "name": "equalNo",
            "type": "u32"
          },
          {
            "name": "equalCount",
            "type": "u32"
          },
          {
            "name": "multipler",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "UnauthorizedWallet",
      "msg": "Unauthorized wallet cannot create game"
    },
    {
      "code": 6001,
      "name": "MinimumPrice",
      "msg": "You should bet at least 0.05 sol"
    },
    {
      "code": 6002,
      "name": "InvalidInstructionAdded",
      "msg": "Invalid Instruction Added"
    },
    {
      "code": 6003,
      "name": "InvalidProgramId",
      "msg": "Invalid Program"
    }
  ]
};
