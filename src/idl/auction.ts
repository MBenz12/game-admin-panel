export type Auction = {
  "version": "0.1.0",
  "name": "auction",
  "instructions": [
    {
      "name": "test",
      "accounts": [],
      "args": []
    },
    {
      "name": "createAuction",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "splTokenMint",
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
          "name": "auctionName",
          "type": "string"
        },
        {
          "name": "minBidPrice",
          "type": "u64"
        },
        {
          "name": "auctionDuration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "bid",
      "accounts": [
        {
          "name": "bidder",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bidderAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastBidder",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lastBidderAta",
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
          "name": "bidPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferToWinner",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionNftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "winner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "winnerNftAta",
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
      "name": "auction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "minBidPrice",
            "type": "u64"
          },
          {
            "name": "autionStartedTime",
            "type": "u64"
          },
          {
            "name": "auctionFinishTime",
            "type": "u64"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "splTokenMint",
            "type": "publicKey"
          },
          {
            "name": "lastBidder",
            "type": "publicKey"
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
      "name": "MinBidPrice",
      "msg": "Smaller than min bid price"
    },
    {
      "code": 6001,
      "name": "AuctionFinished",
      "msg": "Auction is finished already"
    },
    {
      "code": 6002,
      "name": "AuctionNotFinished",
      "msg": "Auction is not finished yet"
    }
  ]
};

export const IDL: Auction = {
  "version": "0.1.0",
  "name": "auction",
  "instructions": [
    {
      "name": "test",
      "accounts": [],
      "args": []
    },
    {
      "name": "createAuction",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "splTokenMint",
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
          "name": "auctionName",
          "type": "string"
        },
        {
          "name": "minBidPrice",
          "type": "u64"
        },
        {
          "name": "auctionDuration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "bid",
      "accounts": [
        {
          "name": "bidder",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bidderAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastBidder",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lastBidderAta",
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
          "name": "bidPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferToWinner",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionNftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "winner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "winnerNftAta",
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
      "name": "auction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "minBidPrice",
            "type": "u64"
          },
          {
            "name": "autionStartedTime",
            "type": "u64"
          },
          {
            "name": "auctionFinishTime",
            "type": "u64"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "splTokenMint",
            "type": "publicKey"
          },
          {
            "name": "lastBidder",
            "type": "publicKey"
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
      "name": "MinBidPrice",
      "msg": "Smaller than min bid price"
    },
    {
      "code": 6001,
      "name": "AuctionFinished",
      "msg": "Auction is finished already"
    },
    {
      "code": 6002,
      "name": "AuctionNotFinished",
      "msg": "Auction is not finished yet"
    }
  ]
};
