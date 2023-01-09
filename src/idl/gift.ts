export type Gift = {
  "version": "0.1.0",
  "name": "gift",
  "instructions": [
    {
      "name": "initializeGlobal",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "global",
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
          "name": "expirationPeriod",
          "type": "u64"
        },
        {
          "name": "gateTokenMint",
          "type": "publicKey"
        },
        {
          "name": "gateTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateGlobal",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "global",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "expirationPeriod",
          "type": "u64"
        },
        {
          "name": "gateTokenMint",
          "type": "publicKey"
        },
        {
          "name": "gateTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createGift",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "target",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gift",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "global",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "splTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "giftTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetNftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenAmount",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "redeem",
      "accounts": [
        {
          "name": "target",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetNftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gift",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gateTokenAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "splTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "giftTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "global",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "expirationPeriod",
            "type": "u64"
          },
          {
            "name": "gateTokenMint",
            "type": "publicKey"
          },
          {
            "name": "gateTokenAmount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "gift",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "splTokenMint",
            "type": "publicKey"
          },
          {
            "name": "gateTokenMint",
            "type": "publicKey"
          },
          {
            "name": "gateTokenAmount",
            "type": "u64"
          },
          {
            "name": "destinationAddress",
            "type": "publicKey"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "expirationTime",
            "type": "u64"
          },
          {
            "name": "redeemed",
            "type": "bool"
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
      "name": "MintFailed",
      "msg": "Mint Failed"
    },
    {
      "code": 6001,
      "name": "MetadataCreateFailed",
      "msg": "Metadata Create Failed"
    },
    {
      "code": 6002,
      "name": "AlreadyRedeemed",
      "msg": "Already Redeemed"
    },
    {
      "code": 6003,
      "name": "Expired",
      "msg": "Time Expired"
    },
    {
      "code": 6004,
      "name": "InvalidHolder",
      "msg": "Invalid Gate Token Holder"
    }
  ]
};

export const IDL: Gift = {
  "version": "0.1.0",
  "name": "gift",
  "instructions": [
    {
      "name": "initializeGlobal",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "global",
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
          "name": "expirationPeriod",
          "type": "u64"
        },
        {
          "name": "gateTokenMint",
          "type": "publicKey"
        },
        {
          "name": "gateTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateGlobal",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "global",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "expirationPeriod",
          "type": "u64"
        },
        {
          "name": "gateTokenMint",
          "type": "publicKey"
        },
        {
          "name": "gateTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createGift",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "target",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gift",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "global",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "splTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "giftTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetNftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenAmount",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "redeem",
      "accounts": [
        {
          "name": "target",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetNftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gift",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gateTokenAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "splTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "giftTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "global",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "expirationPeriod",
            "type": "u64"
          },
          {
            "name": "gateTokenMint",
            "type": "publicKey"
          },
          {
            "name": "gateTokenAmount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "gift",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "splTokenMint",
            "type": "publicKey"
          },
          {
            "name": "gateTokenMint",
            "type": "publicKey"
          },
          {
            "name": "gateTokenAmount",
            "type": "u64"
          },
          {
            "name": "destinationAddress",
            "type": "publicKey"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "expirationTime",
            "type": "u64"
          },
          {
            "name": "redeemed",
            "type": "bool"
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
      "name": "MintFailed",
      "msg": "Mint Failed"
    },
    {
      "code": 6001,
      "name": "MetadataCreateFailed",
      "msg": "Metadata Create Failed"
    },
    {
      "code": 6002,
      "name": "AlreadyRedeemed",
      "msg": "Already Redeemed"
    },
    {
      "code": 6003,
      "name": "Expired",
      "msg": "Time Expired"
    },
    {
      "code": 6004,
      "name": "InvalidHolder",
      "msg": "Invalid Gate Token Holder"
    }
  ]
};
