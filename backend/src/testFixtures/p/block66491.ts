import { BlockP } from "../../rpc/types";

const block66491: BlockP = {
  "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
  "chain_id": "NetXR64bNAYkP4S",
  "hash": "BLV6JNsCeRZbXQYtQDyKBXiopzaqjQD3abE3m47efruAPP74gms",
  "header": {
    "level": 66491,
    "proto": 2,
    "predecessor": "BKs1eWRvsPZu7NSRTtPvxixtF13pZz4TwKSorYZ5MVwytst2v3R",
    "timestamp": "2024-06-04T14:40:09Z",
    "validation_pass": 4,
    "operations_hash": "LLoagePKN2cnA9GHMf6Ghzm7CqDam4LW1E8rinGQUdje7MGnCkUFa",
    "fitness": [
      "02",
      "000103bb",
      "",
      "ffffffff",
      "00000000"
    ],
    "context": "CoVDws2fKq2LgwJn3TjtWQVaeccwZGwukptdBxfc3M9aDRggDvj1",
    "payload_hash": "vh3Mde4J3Y9uPJoAawypikziBG9cBuwxiRLgpJ31Ko4LJsAJPGV3",
    "payload_round": 0,
    "proof_of_work_nonce": "0dcf320900000000",
    "liquidity_baking_toggle_vote": "pass",
    "adaptive_issuance_vote": "pass",
    "signature": "siguhDHAEDqBhyVgWxuDHFff2cT5esvHAuoiDtg8AHmPxAKUGNX2jjekFQJNVEaqyVbHYJME143EkDafUuoU4TRZBNzdnMVf"
  },
  "metadata": {
    "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
    "next_protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
    "test_chain_status": {
      "status": "not_running"
    },
    "max_operations_ttl": 360,
    "max_operation_data_length": 32768,
    "max_block_header_length": 289,
    "max_operation_list_length": [
      {
        "max_size": 4194304,
        "max_op": 2048
      },
      {
        "max_size": 32768
      },
      {
        "max_size": 135168,
        "max_op": 132
      },
      {
        "max_size": 524288
      }
    ],
    "proposer": "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc",
    "baker": "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc",
    "level_info": {
      "level": 66491,
      "level_position": 66490,
      "cycle": 5,
      "cycle_position": 9146,
      "expected_commitment": false
    },
    "voting_period_info": {
      "voting_period": {
        "index": 5,
        "kind": "proposal",
        "start_position": 57344
      },
      "position": 9146,
      "remaining": 3141
    },
    "nonce_hash": null,
    "deactivated": [],
    "balance_updates": [
      {
        "kind": "minted",
        "category": "baking rewards",
        "change": "-167251",
        "origin": "block"
      },
      {
        "kind": "freezer",
        "category": "deposits",
        "staker": {
          "baker_own_stake": "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc"
        },
        "change": "167251",
        "origin": "block"
      },
      {
        "kind": "minted",
        "category": "baking rewards",
        "change": "-1499415",
        "origin": "block"
      },
      {
        "kind": "contract",
        "contract": "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc",
        "change": "1499415",
        "origin": "block"
      },
      {
        "kind": "minted",
        "category": "baking bonuses",
        "change": "-115930",
        "origin": "block"
      },
      {
        "kind": "freezer",
        "category": "deposits",
        "staker": {
          "baker_own_stake": "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc"
        },
        "change": "115930",
        "origin": "block"
      },
      {
        "kind": "minted",
        "category": "baking bonuses",
        "change": "-1039322",
        "origin": "block"
      },
      {
        "kind": "contract",
        "contract": "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc",
        "change": "1039322",
        "origin": "block"
      }
    ],
    "liquidity_baking_toggle_ema": 15949254,
    "adaptive_issuance_vote_ema": 364140092,
    "adaptive_issuance_activation_cycle": 6,
    "implicit_operations_results": [
      {
        "kind": "transaction",
        "storage": [
          {
            "int": "1"
          },
          {
            "int": "29751872440"
          },
          {
            "int": "100"
          },
          {
            "bytes": "01e927f00ef734dfc85919635e9afc9166c83ef9fc00"
          },
          {
            "bytes": "0115eb0104481a6d7921160bc982c5e0a561cd8a3a00"
          }
        ],
        "balance_updates": [
          {
            "kind": "minted",
            "category": "subsidy",
            "change": "-416666",
            "origin": "subsidy"
          },
          {
            "kind": "contract",
            "contract": "KT1TxqZ8QtKvLu3V3JH7Gx58n7Co8pgtpQU5",
            "change": "416666",
            "origin": "subsidy"
          }
        ],
        "consumed_milligas": "206532",
        "storage_size": "4632"
      }
    ],
    "proposer_consensus_key": "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc",
    "baker_consensus_key": "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc",
    "consumed_milligas": "0",
    "dal_attestation": "0"
  },
  "operations": [
    [
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "ooMRSwKqU3vQeN6WhxUshp1GkKyM6ucpFMCkdE1ZhwTiN1NzjzD",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 0,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc",
              "consensus_power": 328,
              "consensus_key": "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc"
            }
          }
        ],
        "signature": "sigaZ4FCprABVXCm1rPzGJALK3qFHbEqDwCpuHMBeHfGyZ36XvgQARFgR3zA7teQ7jdtxQPvaijchMUECLE25axL3Xu1GPFQ"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "ooJqMVr7J8Y3bpvtGZujm1VZjC8pXUjTPZ8HgHEHE9TY96Hm9qc",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation_with_dal",
            "slot": 1,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "dal_attestation": "0",
            "metadata": {
              "delegate": "tz1Zt8QQ9aBznYNk5LUBjtME9DuExomw9YRs",
              "consensus_power": 303,
              "consensus_key": "tz1Zt8QQ9aBznYNk5LUBjtME9DuExomw9YRs"
            }
          }
        ],
        "signature": "sigeHcG8DjpKBgUa2JCsWiKSCJU5WF6GHKVKQb2odw8KJQzSL72gz3yNAc1Ejo8KmTghfroJyj46uTE4BP9JvNsXUZ9ivHoH"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "onybK19xhbHhgCP6TQi89F38Si6LfdC5muqm9i1Hx9omo5a1mw2",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 2,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1TnEtqDV9mZyts2pfMy6Jw1BTPs4LMjL8M",
              "consensus_power": 3338,
              "consensus_key": "tz1TnEtqDV9mZyts2pfMy6Jw1BTPs4LMjL8M"
            }
          }
        ],
        "signature": "signXv5okM8aoSUtRoPWSUm42TQdEU6i53tfdTvMzbnfh3GAhKSoTV5inpPsUWhcp7S8xuSoyBbKyNvgwbYAxyNHTRshLBmT"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "ooTMrFTqMAcAGr7sQQqdX3n1p2ryviqtWvnSdNSkxcPSnK15QYp",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 6,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1aKiShiJWeeTSGzuvYWhZPqvMShgrz9Qy4",
              "consensus_power": 325,
              "consensus_key": "tz1aKiShiJWeeTSGzuvYWhZPqvMShgrz9Qy4"
            }
          }
        ],
        "signature": "sigc7ycrtVMc6GKJEwwvZqr7xqeqfsUSrPtMbDd812Baji4N7G6Ze3mKedALp4JaMKoDC2ktKwWr27rLgdh9aJ3enCikNkuM"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "ooGkJqLe5FVJPi77Xb9iC8v8pEYCYXwGGeJ6CNXMTqsUiY5zToY",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 19,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1XMiZwHpHZ8a1AfwRWKfzLskJgZNyV8PHs",
              "consensus_power": 333,
              "consensus_key": "tz1XMiZwHpHZ8a1AfwRWKfzLskJgZNyV8PHs"
            }
          }
        ],
        "signature": "sigtJcbDYtHuuJLs2zB8uX4pyKNsXR4TC3kBGNsso261hHxoM6uHhXZGzE3U3yZDtaCw5bkMfr9YJa1Ti3msTZkvmpaYDmGw"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "opWop5Dn863Hz8asJgWejWQ5gY6PegQRVuY4tPdSPZaPZPSKtxg",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 26,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1YtB3Hn6oghVk96vkpZt6PHrfbyRY1ciL3",
              "consensus_power": 336,
              "consensus_key": "tz1YtB3Hn6oghVk96vkpZt6PHrfbyRY1ciL3"
            }
          }
        ],
        "signature": "sigtgy54FLMmnRDrfAiCcV9BvDk5CRwru6KnjA861GFhDPUbwasRcDzDo5z6UHgjENa1wJHxNVKMictv5nLSQfH6mASFCMcV"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "opA3RgsUgwKG9y5ZL4j3qyUoJoDybD9XYXeH6bPutmFYfm9HCGT",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 30,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1PZY3tEWmXGasYeehXYqwXuw2Z3iZ6QDnA",
              "consensus_power": 332,
              "consensus_key": "tz1PZY3tEWmXGasYeehXYqwXuw2Z3iZ6QDnA"
            }
          }
        ],
        "signature": "sigVkfZ6G7EUZqd5A19tdTm3WN93Pq53ykhWaeur1DiaHbkrnbNjpP7dfLr8izRpdYhsS7b5pgvCnXjip9zdvp8sFJXcSKzM"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "opAPC7w2NXeeSJ7oBNpFHg899FRbEheA23SBs5Y8xMwMMpmUnjT",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 38,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1RuHDSj9P7mNNhfKxsyLGRDahTX5QD1DdP",
              "consensus_power": 323,
              "consensus_key": "tz1RuHDSj9P7mNNhfKxsyLGRDahTX5QD1DdP"
            }
          }
        ],
        "signature": "sigadyF8kNDe8WqX7kZUhc3mRpic248XpSPT8tZHRSru5jmpnqwSpUk7pTZ54JvBSQgHtUUZmpVXdN6aJvDnVZqC7BdchTkZ"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "oosXZTMAMhF2uTpybYjPA4fJ8JLD39AFRWqzRBwd9hHqH3yW6vi",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 50,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1cjyja1TU6fiyiFav3mFAdnDsCReJ12hPD",
              "consensus_power": 274,
              "consensus_key": "tz1cjyja1TU6fiyiFav3mFAdnDsCReJ12hPD"
            }
          }
        ],
        "signature": "siguYT9ELN3RNBXAkLrFasuGLuUbuwqH1seT277rFMRN7dp5LLg6sW3oeU9PhfpjG7AFcUqB5maa6GY33XhbGYhxrVsijy2L"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "oo3mExC1aoVct7BmsficKWxopiVaDGEDiicg6cXYquhotgQ5bVv",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 53,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1gBnaS1n7LKqpaRnyBX5MSmamadXXfzNpt",
              "consensus_power": 330,
              "consensus_key": "tz1gBnaS1n7LKqpaRnyBX5MSmamadXXfzNpt"
            }
          }
        ],
        "signature": "sigTMpNXsShi5EBtTxS6DqqWb3NsMT2sMXRWLDMGSmoL5f2c2jDrqYNb3piYvoVyiTSJv3LxLs8FCtT89Dz6fc57F1SqAmDF"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "op5uDMwus6ReNGR2ZAsQHnP2VPvDUemCDfP1i62kMvjvPgCCjBB",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 73,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1V1Lu93CPgeN6AXM3Ba9oreAAxcJCoYNJN",
              "consensus_power": 26,
              "consensus_key": "tz1V1Lu93CPgeN6AXM3Ba9oreAAxcJCoYNJN"
            }
          }
        ],
        "signature": "signcgNH1bM5BcX5pfhWkG96eYr72pwJ3cihsQUXYEVZ5m3WjYns9P96W4dhJChKTTsoPZH95QpWiUe9oCTHtvw8eq6BPJDP"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "onwgbPDaxjc5EeXBNuYrrwbYWsUrD4RV4gCUqE1JCvSQmq6pm73",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 413,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1TGKSrZrBpND3PELJ43nVdyadoeiM1WMzb",
              "consensus_power": 32,
              "consensus_key": "tz1TGKSrZrBpND3PELJ43nVdyadoeiM1WMzb"
            }
          }
        ],
        "signature": "sigf1sMLYZjsdFPSKZWGW4vwMzyLrBGFBgw87nXGgvZVd9rZhmRUnp6rrKS9nLQJk91x8e9v4NJCXoTjHAWcjTim4ajPJiPa"
      },
      {
        "protocol": "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ",
        "chain_id": "NetXR64bNAYkP4S",
        "hash": "ooc251M9sKC1y3tEyCD6TfGNztWLiEJWJf6AZnkExuc7ubcZdki",
        "branch": "BLpTB6Y9bsg3qe1NRZeaSb2BaScxW9s7Zd6Y4W6yJbezihqmzLq",
        "contents": [
          {
            "kind": "attestation",
            "slot": 1311,
            "level": 66490,
            "round": 0,
            "block_payload_hash": "vh3EE9p4434T55gFu8XkZHvkeJTYdADkbyqL4AU9cDAvt7AP5PV9",
            "metadata": {
              "delegate": "tz1KiriVKqPKD4vJQuAJCmtyuT6oYrg4zaaW",
              "consensus_power": 5,
              "consensus_key": "tz1KiriVKqPKD4vJQuAJCmtyuT6oYrg4zaaW"
            }
          }
        ],
        "signature": "sigXKrLQZfXUG1BL7VcPpTa8PsLE6eux676CGHWVNhavq7uMtkVBbqBfx9E5KpZEMmAU9qYyNwvKQB1zeHtFS6CE2vpkWq6Z"
      }
    ],
    [],
    [],
    []
  ]
};

export default block66491;