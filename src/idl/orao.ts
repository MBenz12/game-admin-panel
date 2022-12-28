export type Orao = {
  "version": "0.1.0",
  "name": "orao",
  "instructions": [
    {
      "name": "spinAndPullTheTrigger",
      "accounts": [
        {
          "name": "player",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Player will be the `payer` account in the CPI call."
          ]
        },
        {
          "name": "playerState",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "This is the player state account, it is required by Russian-Roulette to store player data"
          ]
        },
        {
          "name": "prevRound",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "This account points to the last VRF request, it is necessary to validate that the player",
            "is alive and is able to play another round."
          ]
        },
        {
          "name": "random",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "This account is the current VRF request account, it'll be the `request` account in the CPI call."
          ]
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "VRF treasury account, it'll be the `treasury` account in the CPI call."
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "VRF on-chain state account, it'll be the `network_state` account in the CPI call."
          ]
        },
        {
          "name": "vrf",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "VRF program address to invoke CPI"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program address to create player_state and to be used in CPI call."
          ]
        }
      ],
      "args": [
        {
          "name": "force",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "playerState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "publicKey"
          },
          {
            "name": "force",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "rounds",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CurrentState",
      "docs": [
        "Last round outcome."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Alive"
          },
          {
            "name": "Dead"
          },
          {
            "name": "Playing"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PlayerDead",
      "msg": "The player is already dead"
    },
    {
      "code": 6001,
      "name": "RandomnessRequestSerializationError",
      "msg": "Unable to serialize a randomness request"
    },
    {
      "code": 6002,
      "name": "YouMustSpinTheCylinder",
      "msg": "Player must spin the cylinder"
    },
    {
      "code": 6003,
      "name": "TheCylinderIsStillSpinning",
      "msg": "The cylinder is still spinning"
    }
  ]
};

export const IDL: Orao = {
  "version": "0.1.0",
  "name": "orao",
  "instructions": [
    {
      "name": "spinAndPullTheTrigger",
      "accounts": [
        {
          "name": "player",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Player will be the `payer` account in the CPI call."
          ]
        },
        {
          "name": "playerState",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "This is the player state account, it is required by Russian-Roulette to store player data"
          ]
        },
        {
          "name": "prevRound",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "This account points to the last VRF request, it is necessary to validate that the player",
            "is alive and is able to play another round."
          ]
        },
        {
          "name": "random",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "This account is the current VRF request account, it'll be the `request` account in the CPI call."
          ]
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "VRF treasury account, it'll be the `treasury` account in the CPI call."
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "VRF on-chain state account, it'll be the `network_state` account in the CPI call."
          ]
        },
        {
          "name": "vrf",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "VRF program address to invoke CPI"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program address to create player_state and to be used in CPI call."
          ]
        }
      ],
      "args": [
        {
          "name": "force",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "playerState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "publicKey"
          },
          {
            "name": "force",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "rounds",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CurrentState",
      "docs": [
        "Last round outcome."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Alive"
          },
          {
            "name": "Dead"
          },
          {
            "name": "Playing"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PlayerDead",
      "msg": "The player is already dead"
    },
    {
      "code": 6001,
      "name": "RandomnessRequestSerializationError",
      "msg": "Unable to serialize a randomness request"
    },
    {
      "code": 6002,
      "name": "YouMustSpinTheCylinder",
      "msg": "Player must spin the cylinder"
    },
    {
      "code": 6003,
      "name": "TheCylinderIsStillSpinning",
      "msg": "The cylinder is still spinning"
    }
  ]
};
