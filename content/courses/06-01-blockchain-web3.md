---
slug: blockchain-web3
title: Blockchain & Web3 Fundamentals
track: web3
order: 1
icon: W3
color: #6f42c1
summary: Web1/Web2/Web3, blockchain data structures, hashing and cryptography, consensus (PoW, PoS), Bitcoin and Ethereum, accounts, transactions and gas, wallets and keys, tokens (ERC-20, ERC-721, ERC-1155), DeFi, NFTs, DAOs, layer 2s, oracles, dApp architecture with .NET and JavaScript, and security.
---

# Overview

**Blockchain** is a distributed, append-only ledger replicated across many computers (nodes). Records are grouped into **blocks**, each linked to the previous one by a cryptographic **hash**, so altering history is practically impossible without redoing the work/stake of the whole network. Nodes agree on the state with a **consensus mechanism** — no central authority.

**Web3** is the idea of an internet where users own their data, identity and assets via blockchains, wallets and smart contracts:

| | Web1 (1990s–2004) | Web2 (2004–) | Web3 |
|---|---|---|---|
| Model | Read | Read + write | Read + write + **own** |
| Content | Static pages | User-generated, platforms | User-owned assets & data |
| Identity | None | Platform accounts (email/password, OAuth) | **Wallet** (public key) |
| Money | — | Payment gateways | Native crypto, tokens |
| Control | Site owners | Big platforms | Protocols, smart contracts, DAOs |

Main uses: cryptocurrencies and payments, stablecoins, decentralised finance (DeFi), NFTs and digital ownership, tokenisation of real-world assets (RWA), supply-chain traceability, decentralised identity, DAOs, gaming.

**Honest perspective for interviews:** blockchains trade performance and simplicity for decentralisation and trustlessness. Good answers mention when a normal database is the better choice, regulation (e.g. India's 30% tax on virtual digital asset gains and 1% TDS; Taiwan's VASP registration regime) and security risks (scams, hacks, key loss).

# Versions

| Year | Milestone |
|---|---|
| 1991 | Haber & Stornetta — cryptographically secured chain of timestamped documents |
| 2008 | **Bitcoin whitepaper** by the pseudonymous **Satoshi Nakamoto** |
| Jan 2009 | Bitcoin genesis block mined; network launched |
| 2013 | Vitalik Buterin publishes the **Ethereum whitepaper** |
| **Jul 2015** | **Ethereum mainnet** (Frontier) — programmable smart contracts, EVM |
| 2015 | Hyperledger (Linux Foundation) for enterprise/permissioned chains |
| 2017 | ICO boom; ERC-20 standardised; CryptoKitties (early NFTs, ERC-721 finalised 2018) |
| 2020 | "DeFi summer" (Uniswap, Aave, Compound); Ethereum Beacon Chain launched (PoS) |
| 2021 | NFT boom; **EIP-1559** fee market (London upgrade); El Salvador makes BTC legal tender |
| **Sep 2022** | **The Merge** — Ethereum switches from Proof of Work to **Proof of Stake** (~99.95% less energy) |
| 2023 | Shanghai/Capella (staking withdrawals); ERC-4337 account abstraction deployed |
| **2024** | **Dencun** (EIP-4844 "blobs" → much cheaper layer-2 fees); US spot Bitcoin ETFs (Jan) and Ether ETFs (Jul); Bitcoin's 4th halving (Apr) |
| **2025** | **Pectra** upgrade (May — EIP-7702 smart accounts for regular wallets, higher validator stake limit); **Fusaka** (Dec 2025 — PeerDAS for more blob capacity) |

Programming-language and tooling versions: Solidity 0.4 (2016) → 0.8 (2020, checked arithmetic) → 0.8.x current; ethers.js v6 (2023); viem 2 (2024); Nethereum 4.x/5.x for .NET.

# Lifecycle

**Transaction lifecycle on Ethereum:**

1. User builds a transaction in a wallet (to, value, data, gas limit, max fee, nonce).
2. The wallet **signs** it with the private key (ECDSA secp256k1).
3. Broadcast to a node via JSON-RPC (`eth_sendRawTransaction`) → enters the **mempool**.
4. A **block proposer** (validator in PoS) selects transactions (usually by fee/priority tip) and builds a block (about every **12 seconds** — one slot).
5. Transactions execute in the **EVM**; state changes (balances, contract storage); gas is charged; events/logs emitted; a **receipt** records status.
6. The block is attested by validators → added to the chain → **confirmations** accumulate.
7. **Finality** — under Ethereum PoS a block is finalised after two epochs (~12.8 minutes); then reverting it would require destroying at least 1/3 of staked ETH.

**Smart contract lifecycle:** design → write (Solidity) → test (unit + fuzz) → audit → deploy (a transaction creating the contract; code is **immutable** unless an upgrade pattern is used) → verify source on a block explorer → interact → upgrade via proxy (if designed) or migrate → pause/deprecate.

**Block lifecycle (Bitcoin PoW):** transactions in mempool → miners assemble a block → find a nonce so the block hash is below the difficulty target (~10 minutes average) → broadcast → nodes validate → longest valid (most-work) chain wins; 6 confirmations is the common safety threshold.

# Tools

| Area | Tools |
|---|---|
| Wallets | MetaMask, Coinbase Wallet, Rabby, Trust Wallet; hardware: Ledger, Trezor; Safe (multisig) |
| Node access (RPC) | Infura, Alchemy, QuickNode, own node (Geth, Nethermind (written in .NET/C#), Reth, Erigon + consensus client) |
| Development frameworks | **Hardhat**, **Foundry** (forge/cast/anvil), Remix IDE (browser) |
| Libraries (JS/TS) | **ethers.js**, **viem**, wagmi (React hooks), web3.js (legacy, sunset 2025) |
| Libraries (.NET) | **Nethereum** |
| Contract libraries | **OpenZeppelin Contracts** (ERC-20/721/1155, access control, upgradeable proxies) |
| Explorers | Etherscan, Blockscout, Polygonscan, BscScan |
| Test networks | Sepolia, Holesky/Hoodi (Ethereum testnets), local Anvil/Hardhat Network |
| Indexing & data | The Graph, Dune, Etherscan APIs |
| Oracles | Chainlink, Pyth |
| Storage | IPFS, Filecoin, Arweave |
| Security | Slither, Mythril, Echidna, Foundry fuzzing, audits (OpenZeppelin, Trail of Bits, Certora) |

# Module: Blockchain Fundamentals

## Lesson: [Basic|High] What a blockchain is and how blocks link

Each block contains a **header** (previous block hash, timestamp, Merkle root of transactions, plus consensus data like nonce/difficulty or proposer info) and a **list of transactions**.

```
Block 100                     Block 101                     Block 102
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│ prevHash: 0xab12 │◄────────│ prevHash: H(100) │◄────────│ prevHash: H(101) │
│ merkleRoot       │         │ merkleRoot       │         │ merkleRoot       │
│ txs: [...]       │         │ txs: [...]       │         │ txs: [...]       │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

Changing any transaction in block 100 changes its hash, which breaks the link in block 101 and every later block — so tampering is obvious, and rewriting requires re-doing consensus for all following blocks faster than the honest network.

Properties: **decentralised**, **immutable/append-only**, **transparent** (public chains), **pseudonymous** (addresses, not names), **trustless** (verify instead of trust), **fault-tolerant**.

Types: **public permissionless** (Bitcoin, Ethereum — anyone can join), **private/permissioned** (Hyperledger Fabric, R3 Corda, Quorum — known participants), **consortium** (several organisations), **hybrid**.

## Lesson: [Basic|High] Cryptography: hashing, keys, signatures and Merkle trees

- **Hash function** (SHA-256 in Bitcoin, Keccak-256 in Ethereum): deterministic, fixed-size output, one-way, tiny input change → completely different output (avalanche), collision-resistant.
- **Public-key cryptography** (elliptic curve **secp256k1**): a random **private key** (256-bit) → **public key** → **address** (Ethereum: last 20 bytes of Keccak-256 of the public key, shown as `0x...`).
- **Digital signature** (ECDSA): proves the transaction was authorised by the private-key holder without revealing it; anyone can verify with the public key.
- **Merkle tree**: transactions hashed pairwise up to a single **Merkle root** in the header — lets light clients prove a transaction is in a block with a small proof (O(log n)).
- **Seed phrase** (BIP-39 mnemonic, 12/24 words) derives many keys (BIP-32/44 hierarchical deterministic wallets). **Whoever has the seed phrase owns the funds** — no password reset.

```js
// Hashing and signing with ethers.js v6
import { keccak256, toUtf8Bytes, Wallet, verifyMessage } from "ethers";
keccak256(toUtf8Bytes("hello"));                        // 0x1c8aff95...
const wallet = Wallet.createRandom();                    // never log real keys
const sig = await wallet.signMessage("Login nonce 4821");
verifyMessage("Login nonce 4821", sig) === wallet.address;   // true → "Sign-In with Ethereum" idea
```

## Lesson: [Basic|High] Consensus mechanisms

| Mechanism | How blocks are produced | Examples | Trade-offs |
|---|---|---|---|
| **Proof of Work** | Miners compete to solve a hash puzzle; most cumulative work wins | Bitcoin, Litecoin | Very secure and simple; high energy use; slow |
| **Proof of Stake** | Validators lock stake; chosen to propose/attest; misbehaviour is **slashed** | Ethereum (since 2022), Cardano, Solana (PoS + Proof of History) | Energy-efficient, faster finality; complexity, stake concentration |
| Delegated PoS | Token holders vote for a few block producers | EOS, TRON | Fast; more centralised |
| PBFT / BFT variants | Known validators vote in rounds | Hyperledger Fabric (ordering), Tendermint/CometBFT (Cosmos) | Instant finality; limited validator count |
| Proof of Authority | Approved identities sign blocks | Private networks, some testnets | Fast; centralised trust |

Ethereum PoS numbers: validators stake **32 ETH** (Pectra raised the max effective balance to 2,048 ETH); a slot is 12 seconds, an epoch is 32 slots (6.4 minutes); finality after ~2 epochs.

**51% attack** — controlling the majority of hash power (PoW) or stake (PoS) allows reorganising recent blocks/double spending (not stealing arbitrary funds). **Double spending** is prevented by consensus on transaction order.

**Blockchain trilemma** (Vitalik Buterin): hard to maximise **decentralisation, security and scalability** at the same time — hence layer-2 solutions.

## Lesson: [Basic|Medium] Bitcoin vs Ethereum

| | Bitcoin | Ethereum |
|---|---|---|
| Launched | 2009 | 2015 |
| Purpose | Digital money / store of value | Programmable platform (world computer) |
| Consensus | Proof of Work | Proof of Stake (since Sep 2022) |
| Block time | ~10 minutes | 12 seconds |
| Supply | Capped at 21 million BTC; halving every 210,000 blocks (~4 years) | No hard cap; issuance to validators, part of fees burned (EIP-1559) |
| Model | **UTXO** (unspent transaction outputs) | **Account-based** (balances + contract storage) |
| Smart contracts | Limited (Bitcoin Script) | Turing-complete (EVM, Solidity) |
| Units | 1 BTC = 100,000,000 satoshis | 1 ETH = 10^18 wei; 1 gwei = 10^9 wei |

# Module: Ethereum in Depth

## Lesson: [Intermediate|High] Accounts, transactions, gas and fees

**Accounts:**

- **EOA** (Externally Owned Account) — controlled by a private key; has balance and nonce; initiates transactions.
- **Contract account** — has code and storage; runs only when called; no private key.
- **Smart accounts** (account abstraction, ERC-4337; EIP-7702 since Pectra) — programmable wallets: social recovery, batched calls, paying gas in tokens (paymasters), session keys.

**Gas:** every EVM operation costs gas (a unit of computation). A transaction specifies a **gas limit**. Since **EIP-1559** (2021):

`fee = gasUsed × (baseFee + priorityTip)` — the **base fee** is set by the protocol per block (rises when blocks are full) and is **burned**; the **priority fee (tip)** goes to the validator. Users set `maxFeePerGas` and `maxPriorityFeePerGas`. Unused gas is refunded; if gas runs out, the transaction **reverts** but the fee is still paid.

A simple ETH transfer costs 21,000 gas. **Nonce** — per-account counter preventing replay and ordering transactions.

## Lesson: [Intermediate|High] Smart contracts and the EVM

A **smart contract** is a program deployed on the blockchain that runs exactly as written: it holds state (storage), exposes functions, emits **events**, and can hold and move funds. The **EVM** (Ethereum Virtual Machine) is the deterministic, sandboxed, stack-based VM that executes contract bytecode on every node.

- Languages: **Solidity** (most common), Vyper (Pythonic), Yul (low-level).
- Compiled to **bytecode** + an **ABI** (Application Binary Interface — JSON describing functions/events, used by clients to encode calls).
- **Read calls** (`view`/`pure` via `eth_call`) are free and don't create transactions; **writes** require a signed transaction and gas.
- **Immutability**: code can't be changed after deployment — upgrades use **proxy patterns** (Transparent, UUPS) with an admin, which reintroduces trust.
- Contracts can't fetch off-chain data themselves → **oracles**.
- EVM-compatible chains: Polygon PoS, BNB Chain, Avalanche C-Chain, and layer 2s (Arbitrum, Optimism, Base, zkSync, Scroll, Linea).

The full Solidity course is next in this track.

## Lesson: [Intermediate|High] Token standards: ERC-20, ERC-721, ERC-1155

| Standard | Type | Key functions | Examples |
|---|---|---|---|
| **ERC-20** | Fungible tokens (each unit identical) | `totalSupply`, `balanceOf`, `transfer`, `approve`, `allowance`, `transferFrom`; events `Transfer`, `Approval` | USDC, USDT, DAI, LINK, UNI |
| **ERC-721** | Non-fungible tokens (unique IDs) | `ownerOf`, `safeTransferFrom`, `approve`, `setApprovalForAll`, `tokenURI` (metadata) | NFT art, tickets, domain names (ENS) |
| **ERC-1155** | Multi-token (fungible + non-fungible in one contract) | `balanceOf(account, id)`, `safeBatchTransferFrom` | Game items |
| ERC-4626 | Tokenised vaults | `deposit`, `withdraw`, `convertToShares` | Yield vaults |
| ERC-2612 | `permit` (gasless approvals via signatures) | `permit` | Many ERC-20s |
| ERC-4337 | Account abstraction (smart accounts) | UserOperations, bundlers, paymasters | Smart wallets |

**Approve + transferFrom** pattern: a user approves a DEX contract to spend N tokens, then the DEX pulls them. Unlimited approvals are a common risk — wallets that approved malicious contracts can be drained.

**Stablecoins**: tokens pegged to fiat (USDC, USDT — backed by reserves; DAI — crypto-collateralised).

## Lesson: [Intermediate|Medium] DeFi, NFTs and DAOs

- **DeFi** (decentralised finance): financial services as smart contracts — **DEXs** using **Automated Market Makers** (Uniswap: constant product `x × y = k`, liquidity pools, LP tokens, **impermanent loss**), **lending/borrowing** (Aave, Compound: over-collateralised loans, liquidation), stablecoins, derivatives, yield aggregators, liquid staking (Lido). Key risks: smart-contract bugs, oracle manipulation, **flash-loan** attacks, liquidation cascades.
- **NFTs**: ERC-721/1155 tokens representing unique items; metadata (name, image) usually stored off-chain on IPFS/Arweave with a `tokenURI`; marketplaces (OpenSea, Blur); royalties (ERC-2981, not enforced on-chain universally). Uses beyond art: tickets, memberships, certificates, gaming items, real-world asset titles.
- **DAOs** (decentralised autonomous organisations): governance by token holders voting on proposals (Governor contracts, Snapshot off-chain voting), treasury in a **multisig** (Safe). Risks: low participation, whale dominance, governance attacks.

## Lesson: [Intermediate|High] Scaling: layer 1, layer 2, rollups and sidechains

- **Layer 1** — the base chain (Ethereum, Bitcoin, Solana).
- **Layer 2** — executes transactions off the main chain and posts data/proofs to L1, inheriting its security:
  - **Optimistic rollups** (Arbitrum, Optimism, Base): assume transactions are valid; anyone can submit a **fraud proof** during a challenge window (~7 days for withdrawals to L1).
  - **ZK rollups** (zkSync Era, Starknet, Scroll, Linea, Polygon zkEVM): post **validity proofs** (zero-knowledge proofs); faster finality, more complex.
  - **EIP-4844 blobs** (Dencun, 2024) made L2 data much cheaper → L2 fees often cents or less.
- **Sidechains** (Polygon PoS, Gnosis Chain): separate chains with their own consensus and bridges (not L1 security).
- **State channels** (Bitcoin Lightning Network): off-chain payments between parties, settle on-chain.
- **Bridges** move assets between chains — historically the biggest hack targets (Ronin $625M in 2022, Wormhole $325M in 2022).

## Lesson: [Intermediate|Medium] Oracles, storage and indexing

- **Oracles** feed off-chain data (prices, weather, randomness) to contracts — Chainlink Data Feeds, Chainlink VRF (verifiable randomness), Pyth. Using a single DEX spot price as an oracle is a classic exploit vector (flash-loan price manipulation) — use time-weighted or decentralised feeds.
- **Storage**: on-chain storage is very expensive → store files on **IPFS** (content-addressed by hash — CID), pin with services (Pinata, web3.storage), or permanently on **Arweave**; store only the hash/URI on-chain.
- **Indexing**: reading historical events directly from nodes is slow → **The Graph** subgraphs, custom indexers listening to events into a SQL database, or APIs (Alchemy, Moralis, Etherscan).

# Module: Building dApps

## Lesson: [Intermediate|High] dApp architecture

```
Browser (React/Next.js + wagmi/viem or ethers.js)
   │  connect wallet (EIP-1193 provider: MetaMask, WalletConnect)
   │  read: eth_call via RPC provider   write: user signs tx in wallet
   ▼
RPC node (Alchemy/Infura/own node) ─────► Ethereum / L2 (smart contracts)
   ▲                                                │ events
   │                                                ▼
Backend (ASP.NET Core + Nethereum, optional) ◄── indexer / The Graph → SQL DB for fast queries
   │ off-chain data, auth (Sign-In with Ethereum), notifications
   ▼
IPFS / Arweave (NFT metadata, files)
```

Principles: the frontend never holds users' private keys — the **wallet signs**; keep business-critical logic on-chain only when trustlessness is needed; use a backend for indexing, search, notifications and anything private; handle chain IDs, network switching, pending/failed transactions and re-orgs (wait for confirmations).

## Lesson: [Intermediate|High] JavaScript: reading and writing with ethers.js v6

```js
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const provider = new BrowserProvider(window.ethereum);          // MetaMask (EIP-1193)
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();
const token = new Contract("0xTokenAddress", ERC20_ABI, signer);

const decimals = await token.decimals();
const balance = await token.balanceOf(await signer.getAddress());
console.log(formatUnits(balance, decimals));                    // e.g. "125.5"

const tx = await token.transfer("0xRecipient", parseUnits("10", decimals));   // wallet pops up to sign
const receipt = await tx.wait(1);                               // wait for 1 confirmation
console.log(receipt.status === 1 ? "success" : "reverted");

token.on("Transfer", (from, to, value) => console.log(from, to, formatUnits(value, decimals)));
```

Token amounts are integers in the smallest unit (`uint256`) — always use `parseUnits`/`formatUnits` (BigInt), never floating point. In React apps, **wagmi** + **viem** + a connector UI (RainbowKit, ConnectKit, Reown AppKit) is the common stack.

## Lesson: [Intermediate|High] .NET: Nethereum

```csharp
// dotnet add package Nethereum.Web3
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Nethereum.Contracts.Standards.ERC20.ContractDefinition;

var web3 = new Web3("https://sepolia.infura.io/v3/<project-id>");      // read-only
var balanceWei = await web3.Eth.GetBalance.SendRequestAsync("0xAddress");
var eth = Web3.Convert.FromWei(balanceWei.Value);

var erc20 = web3.Eth.ERC20.GetContractService("0xTokenAddress");
var decimals = await erc20.DecimalsQueryAsync();
var tokens = await erc20.BalanceOfQueryAsync("0xAddress");

// Writing requires an account (private key from Key Vault / HSM — NEVER hard-coded)
var account = new Account(privateKeyFromVault, chainId: 11155111);       // Sepolia
var signerWeb3 = new Web3(account, "https://sepolia.infura.io/v3/<project-id>");
var receipt = await signerWeb3.Eth.ERC20.GetContractService("0xTokenAddress")
    .TransferRequestAndWaitForReceiptAsync(new TransferFunction { To = "0xRecipient", Value = Web3.Convert.ToWei(10, decimals) });

// Typed contract services can be generated from ABIs with the Nethereum code generator (VS Code extension / CLI)
```

Typical .NET roles in Web3 projects: backend APIs that index events into SQL Server, custodial/treasury services signing with keys in **Azure Key Vault Managed HSM**, payment confirmation services (watch for transfers to deposit addresses and wait for N confirmations), reporting, and admin tools.

## Lesson: [Intermediate|High] Wallets, custody and Web3 authentication

- **Custodial** wallets (exchange holds keys — e.g. centralised exchanges) vs **non-custodial** (user holds keys — MetaMask, hardware wallets). "Not your keys, not your coins."
- **Hot** (online) vs **cold** (offline, hardware/air-gapped) storage; **multisig** (Safe: M-of-N signatures) for treasuries; **MPC** wallets split keys across parties.
- **Sign-In with Ethereum (SIWE, ERC-4361)**: backend issues a nonce → user signs a structured message → backend verifies the signature recovers the address → issues a session/JWT. No passwords; protects against replay with nonce, domain and expiry.
- **EIP-712** typed structured data signing — human-readable signatures for permits/orders.

## Lesson: [Advanced|High] Security, risks and compliance

Common attacks and failures:

- **Private key / seed phrase theft** (phishing, malware, fake support) — the #1 cause of individual losses.
- **Malicious approvals** and **drainer** sites; address-poisoning scams.
- **Smart contract bugs**: reentrancy (The DAO, 2016 — led to the Ethereum/Ethereum Classic split), access control mistakes, integer issues (pre-0.8), oracle manipulation, flash-loan exploits, front-running/MEV, signature replay, upgradeable proxy misconfiguration.
- **Bridge hacks** and compromised validator/multisig keys.
- **Rug pulls** and pump-and-dump schemes.

Mitigations: audits, OpenZeppelin libraries, tests + fuzzing + formal verification, bug bounties (Immunefi), timelocks and multisig admins, monitoring (Forta, OpenZeppelin Defender), limiting approvals, hardware wallets.

**Compliance:** KYC/AML for exchanges and on/off-ramps, the FATF "travel rule", tax reporting. India: virtual digital assets taxed at 30% on gains plus 1% TDS on transfers (since 2022), and exchanges must register with the Financial Intelligence Unit (FIU-IND). Taiwan: crypto service providers must register for AML with the Financial Supervisory Commission (FSC), with a dedicated VASP law being developed. Rules change — check current regulations.

# Interview

## [Beginner|High] What is blockchain? Explain it simply.

A blockchain is a shared digital ledger copied across many computers. Transactions are grouped into blocks; each block stores the hash of the previous block, forming a chain, so changing an old record would break every later link. A consensus mechanism lets the computers agree on the next block without a central authority. Result: a tamper-evident, transparent, append-only record that participants don't have to trust a single party to maintain.

## [Beginner|High] What is Web3 and how is it different from Web2?

Web2 is today's platform-centric internet: users create content but companies own the data, accounts and payment rails. Web3 adds native ownership via blockchains: users hold assets and identity in wallets (private keys), applications are built on open smart contracts, and value can move peer to peer without intermediaries. Trade-offs: user responsibility for keys, scalability limits, UX friction and regulatory uncertainty.

## [Beginner|High] What is a hash and why is it important in blockchain?

A hash function maps any input to a fixed-size output (SHA-256 → 256 bits) that is deterministic, one-way, collision-resistant and changes completely with any tiny input change. Blockchains use hashes to link blocks (each header contains the previous block's hash), summarise transactions (Merkle root), derive addresses, and in Proof of Work mining (finding a hash below a target).

## [Beginner|High] What is the difference between a public and a private blockchain?

A public (permissionless) blockchain lets anyone read, transact and participate in consensus (Bitcoin, Ethereum) — maximally decentralised and censorship-resistant, but slower and fully transparent. A private/permissioned blockchain restricts participants to known organisations (Hyperledger Fabric, Corda) — faster, private data channels, governance by a consortium, but less decentralised; often used for supply chains and inter-bank settlement.

## [Beginner|High] What is a smart contract?

A program stored on a blockchain that runs automatically and deterministically when called by a transaction, enforcing rules without intermediaries — e.g. an escrow releasing funds when conditions are met, a token contract tracking balances, a DEX swapping tokens. On Ethereum, contracts are written in Solidity, compiled to EVM bytecode, are immutable once deployed (unless proxies are used), and every execution costs gas.

## [Beginner|Medium] What is a wallet? What happens if you lose your seed phrase?

A wallet manages private keys and signs transactions; the blockchain holds the balances. A seed phrase (12–24 words, BIP-39) is a human-readable backup from which all the wallet's keys are derived. If you lose it and the device, the funds are permanently inaccessible — there's no reset. If someone else gets it, they can take everything. Store it offline; never share it or type it into websites.

## [Intermediate|High] Proof of Work vs Proof of Stake?

In PoW, miners spend computing power to find a valid block hash; the chain with the most cumulative work is canonical — very secure and battle-tested (Bitcoin) but energy-intensive. In PoS, validators lock up (stake) coins to earn the right to propose and attest blocks; dishonest behaviour is punished by slashing — far more energy-efficient (Ethereum cut energy use by ~99.95% after The Merge in Sep 2022) and gives economic finality, but is more complex and can concentrate stake.

## [Intermediate|High] Explain gas and EIP-1559.

Gas measures the computational work of an EVM operation; every transaction sets a gas limit and pays `gasUsed × gas price`. EIP-1559 (London, 2021) introduced a protocol-set **base fee** per block (adjusts with congestion and is burned) plus an optional **priority tip** to the validator; users specify `maxFeePerGas` and `maxPriorityFeePerGas`. Failed transactions still consume gas. Gas prevents infinite loops and spam and pays for network resources.

## [Intermediate|High] What are ERC-20 and ERC-721?

Ethereum token standards (interfaces). ERC-20 defines fungible tokens with `balanceOf`, `transfer`, `approve`, `allowance`, `transferFrom` and Transfer/Approval events — every unit is identical (stablecoins, governance tokens). ERC-721 defines non-fungible tokens where each `tokenId` is unique with an `ownerOf` and `tokenURI` for metadata (NFTs). ERC-1155 supports many fungible and non-fungible token types in one contract with batch transfers.

## [Intermediate|High] What are layer 2 solutions? Optimistic vs ZK rollups?

Layer 2s execute transactions off the main chain and post compressed data and proofs to layer 1, inheriting its security while increasing throughput and cutting fees. Optimistic rollups (Arbitrum, Optimism, Base) assume batches are valid and allow fraud proofs during a challenge period (~7 days for L1 withdrawals). ZK rollups (zkSync, Starknet, Scroll, Linea) post validity proofs, giving faster finality without a challenge window but with more complex proving. EIP-4844 blobs (2024) made L2 data much cheaper.

## [Intermediate|Medium] What is the difference between the UTXO model and the account model?

UTXO (Bitcoin): a transaction consumes previous unspent outputs and creates new ones; a balance is the sum of UTXOs you can unlock. It's parallelisable and privacy-friendlier (new addresses), but less convenient for complex logic. Account model (Ethereum): global state stores balances and contract storage per address, and transactions update them directly — simpler for smart contracts, needs nonces for replay protection.

## [Intermediate|Medium] What is an oracle and why is it needed?

Smart contracts can only see on-chain data; they can't call web APIs, because every node must produce the same result. An oracle is a service that brings external data (prices, sports results, randomness) on-chain, ideally decentralised and tamper-resistant (Chainlink aggregates many data providers). Poor oracle design — e.g. using a single DEX pool's spot price — enables price manipulation and flash-loan exploits.

## [Intermediate|Medium] What is the blockchain trilemma?

The observation that a blockchain finds it hard to be simultaneously decentralised, secure and scalable — optimising two tends to sacrifice the third. Bitcoin and Ethereum L1 prioritise decentralisation and security; high-throughput chains often use fewer, more powerful validators. Layer 2 rollups, sharding of data (danksharding/blobs) and better clients try to improve scalability without giving up the other two.

## [Advanced|High] How would you build a backend in .NET that confirms crypto payments?

Generate a unique deposit address or payment reference per order (HD wallet derivation, or a payment contract with order IDs), subscribe to new blocks/Transfer events via an RPC provider (Nethereum with WebSockets or a provider's webhooks), match incoming transfers to orders (exact token contract, amount, decimals), wait for N confirmations or finality before marking paid (re-org safety), make processing idempotent (by tx hash + log index), persist state in SQL Server, handle under/over-payments and expirations, keep signing keys in an HSM (Azure Key Vault Managed HSM) if you send refunds, and monitor RPC failures with fallbacks. Also account for KYC/AML and tax rules.

## [Advanced|Medium] What are MEV and front-running?

Maximal Extractable Value is profit that block builders/searchers make by including, excluding or reordering transactions in a block — e.g. front-running a large DEX swap (buy before it, sell after: a "sandwich attack"), arbitrage and liquidations. Users are protected by slippage limits, private transaction relays (Flashbots Protect, MEV-blocker RPCs), batch auctions (CoW Swap) and commit-reveal schemes in contract design.

## [Advanced|Medium] When should you NOT use a blockchain?

When a single trusted party (or a small set that already trusts each other) controls the data; when you need high throughput, low latency and cheap writes; when data must be deleted or kept private (GDPR right to erasure conflicts with immutability); when there's no need for censorship resistance or a shared ledger among mistrusting parties. A regular database with audit logs, digital signatures or a ledger database (SQL Server ledger tables, Azure Confidential Ledger) is usually simpler, cheaper and faster.

## [Scenario|High] A user says their tokens were stolen even though they never shared their seed phrase. What likely happened, and how could the dApp have protected them?

Likely causes: they signed a malicious **approval** or **permit** (gasless signature) giving a drainer contract the right to spend their tokens, signed a phishing transaction disguised as a mint/claim, interacted with a compromised frontend, or had malware. Protections: show clear human-readable signing (EIP-712), request exact (not unlimited) approvals, warn on known-malicious addresses, use transaction simulation (wallets like Rabby/Blockaid), domain verification, and encourage revoking old approvals (revoke.cash) and using hardware wallets.

## [Scenario|High] Your company wants to "put the supply chain on the blockchain". How do you evaluate it?

Ask: who are the participants and do they distrust each other? Who writes data, and who verifies it? Blockchain only guarantees that recorded data hasn't been altered — not that it was true when entered (garbage in, garbage out), so you need trusted inputs (IoT sensors, signed attestations). Evaluate a permissioned ledger (Hyperledger Fabric) vs a public chain with hashes/anchoring vs a shared database with signed audit logs; consider privacy of commercial data, throughput, cost, governance, integration with ERP, and regulation. Often the best design anchors document hashes on-chain and keeps data off-chain.

## [Scenario|Medium] Transactions from your backend keep failing with "nonce too low" or get stuck pending. How do you fix it?

Nonces must be sequential per sending account. Concurrent workers sending from the same account race for nonces, and a stuck low-fee transaction blocks later ones. Fixes: one nonce manager per account (serialise sends, track the pending nonce in DB/Redis), set EIP-1559 fees from current base fee + a reasonable tip, replace stuck transactions by resending the same nonce with a higher fee (speed-up/cancel), use multiple sender accounts for throughput, and monitor the mempool and receipts with retries.

# Cheatsheet

## Core terms

Block · hash · Merkle root · node · consensus · mempool · confirmation · finality · fork · wallet · private/public key · address · seed phrase · gas · nonce · smart contract · EVM · ABI · token · dApp · oracle · bridge · L1/L2.

## Consensus

PoW (Bitcoin, mining) · PoS (Ethereum since Sep 2022, staking, slashing, 32 ETH validator, 12 s slots, ~12.8 min finality) · DPoS · BFT · PoA.

## Bitcoin vs Ethereum

BTC: 2009, PoW, 10-min blocks, 21M cap, UTXO, halving every ~4 years. ETH: 2015, PoS, 12-s blocks, account model, smart contracts, 1 ETH = 10^18 wei, EIP-1559 fee burn.

## Token standards

ERC-20 fungible · ERC-721 NFT · ERC-1155 multi-token · ERC-4626 vaults · ERC-2612 permit · ERC-4337 account abstraction · EIP-712 typed signing · ERC-4361 Sign-In with Ethereum.

## Scaling

Optimistic rollups (Arbitrum, Optimism, Base — 7-day challenge) · ZK rollups (zkSync, Starknet, Scroll, Linea) · sidechains (Polygon PoS) · Lightning (BTC) · EIP-4844 blobs (2024).

## Upgrades to remember

The DAO hack 2016 · EIP-1559 2021 · The Merge 2022 · Shanghai 2023 · Dencun 2024 · Pectra May 2025 · Fusaka Dec 2025.

## Dev stack

Solidity · Hardhat / Foundry / Remix · OpenZeppelin · ethers.js v6 / viem / wagmi · Nethereum (.NET) · MetaMask · Infura/Alchemy · Etherscan · Sepolia testnet · IPFS · The Graph · Chainlink.

## Security

Seed phrase = ownership · limit approvals · audits · reentrancy · oracle manipulation · flash loans · bridge risk · MEV · multisig + timelock admins.
