export type MintMachine = {
  "version": "0.1.0",
  "name": "mint_machine",
  "instructions": [
    {
      "name": "initializeNftVault",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftVaultPool",
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
          "name": "poolBump",
          "type": "u8"
        },
        {
          "name": "mintPrice",
          "type": "u64"
        },
        {
          "name": "totalSupply",
          "type": "u32"
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
          "name": "creator",
          "type": "publicKey"
        }
      ],
      "returns": null
    },
    {
      "name": "setMintPrice",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "mintPrice",
          "type": "u64"
        }
      ],
      "returns": null
    },
    {
      "name": "buyFromVault",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftVaultPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultPoolAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": null
    },
    {
      "name": "addUri",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "bytes"
        }
      ],
      "returns": null
    },
    {
      "name": "mint",
      "accounts": [
        {
          "name": "mintAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftVaultPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
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
        }
      ],
      "args": [],
      "returns": null
    }
  ],
  "accounts": [
    {
      "name": "nftVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "poolBump",
            "type": "u8"
          },
          {
            "name": "mintPrice",
            "type": "u64"
          },
          {
            "name": "totalSupply",
            "type": "u32"
          },
          {
            "name": "soldMints",
            "type": {
              "vec": "publicKey"
            }
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
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "uris",
            "type": {
              "vec": "bytes"
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NotEnoughTokens",
      "msg": "Not Enough Tokens."
    },
    {
      "code": 6001,
      "name": "AlreadyMinted",
      "msg": "Already Minted"
    },
    {
      "code": 6002,
      "name": "NotEnoughSol",
      "msg": "Not Enough SOL"
    },
    {
      "code": 6003,
      "name": "MintFailed",
      "msg": "Mint Failed"
    },
    {
      "code": 6004,
      "name": "MetadataCreateFailed",
      "msg": "Metadata Create Failed"
    }
  ]
};

export const IDL: MintMachine = {
  "version": "0.1.0",
  "name": "mint_machine",
  "instructions": [
    {
      "name": "initializeNftVault",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftVaultPool",
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
          "name": "poolBump",
          "type": "u8"
        },
        {
          "name": "mintPrice",
          "type": "u64"
        },
        {
          "name": "totalSupply",
          "type": "u32"
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
          "name": "creator",
          "type": "publicKey"
        }
      ],
      "returns": null
    },
    {
      "name": "setMintPrice",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "mintPrice",
          "type": "u64"
        }
      ],
      "returns": null
    },
    {
      "name": "buyFromVault",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftVaultPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultPoolAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": null
    },
    {
      "name": "addUri",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "bytes"
        }
      ],
      "returns": null
    },
    {
      "name": "mint",
      "accounts": [
        {
          "name": "mintAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftVaultPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
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
        }
      ],
      "args": [],
      "returns": null
    }
  ],
  "accounts": [
    {
      "name": "nftVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "poolBump",
            "type": "u8"
          },
          {
            "name": "mintPrice",
            "type": "u64"
          },
          {
            "name": "totalSupply",
            "type": "u32"
          },
          {
            "name": "soldMints",
            "type": {
              "vec": "publicKey"
            }
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
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "uris",
            "type": {
              "vec": "bytes"
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NotEnoughTokens",
      "msg": "Not Enough Tokens."
    },
    {
      "code": 6001,
      "name": "AlreadyMinted",
      "msg": "Already Minted"
    },
    {
      "code": 6002,
      "name": "NotEnoughSol",
      "msg": "Not Enough SOL"
    },
    {
      "code": 6003,
      "name": "MintFailed",
      "msg": "Mint Failed"
    },
    {
      "code": 6004,
      "name": "MetadataCreateFailed",
      "msg": "Metadata Create Failed"
    }
  ]
};
