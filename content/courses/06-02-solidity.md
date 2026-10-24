---
slug: solidity
title: Solidity & Smart Contract Development
track: web3
order: 2
group: Blockchain
icon: Sol
color: #363636
summary: Solidity syntax, data types and data locations, functions, visibility and modifiers, events, errors, inheritance and interfaces, ERC-20/721 with OpenZeppelin, payable and Ether transfers, upgradeable contracts, gas optimisation, testing with Hardhat/Foundry, deployment and security vulnerabilities.
---

# Overview

**Solidity** is a statically typed, curly-brace, contract-oriented language for writing smart contracts on the **EVM** (Ethereum and EVM-compatible chains: Arbitrum, Optimism, Base, Polygon, BNB Chain, Avalanche...). Syntax is influenced by C++, Python and JavaScript. Created by Gavin Wood and others; developed by the Ethereum Foundation's Solidity team (first released 2015).

A contract is like a class: **state variables** (stored permanently on-chain), **functions**, **modifiers**, **events**, **errors**, and can inherit from other contracts. Code is compiled with **solc** into EVM bytecode plus an **ABI**.

Smart contract development is high-stakes: deployed code is public, usually immutable, and often holds money — bugs are exploited quickly. Interviews focus heavily on **security**, **gas costs** and **testing**.

# Versions

| Version | Year | Notable changes |
|---|---|---|
| 0.1–0.3 | 2015–2016 | Early releases |
| 0.4.x | 2016–2018 | Widely used in the ICO era; `constant` functions; many legacy contracts |
| 0.5.0 | 2018 | Explicit data locations, `address payable`, explicit visibility required |
| 0.6.0 | 2019 | `virtual`/`override` required, `receive()`/`fallback()` split, try/catch for external calls |
| 0.7.0 | 2020 | `now` removed (use `block.timestamp`), constructor visibility removed |
| **0.8.0** | Dec 2020 | **Checked arithmetic** (overflow/underflow reverts by default; `unchecked {}` to opt out), ABI coder v2 default |
| 0.8.4 | 2021 | **Custom errors** (`error InsufficientBalance(...)` — cheaper than revert strings) |
| 0.8.18–0.8.30 | 2023–2025 | User-defined operators, named mapping parameters, transient storage (`transient` keyword, 0.8.28, after Dencun's EIP-1153), new EVM version defaults (Cancun, Prague) |
| 0.9 (planned) | — | Further breaking cleanups |

Always pin the compiler: `pragma solidity 0.8.28;` (or `^0.8.24`) and use a recent 0.8.x release. Library versions: OpenZeppelin Contracts 4.x (2021–2023) → **5.x** (2023+, custom errors, `Ownable(initialOwner)`, namespaced storage).

# Lifecycle

**Development lifecycle:**

1. **Specify** — requirements, roles, invariants ("total supply equals sum of balances"), threat model.
2. **Write** — Solidity using audited building blocks (OpenZeppelin).
3. **Compile** — `forge build` / `npx hardhat compile` → bytecode + ABI.
4. **Test** — unit tests, fuzz tests, invariant tests, fork tests against mainnet state; coverage.
5. **Static analysis** — Slither, compiler warnings, linters (solhint).
6. **Audit** — internal review + external audit; bug bounty.
7. **Deploy** — testnet (Sepolia) → mainnet with a script; record addresses; deploy through a multisig where possible.
8. **Verify** — publish source on Etherscan/Blockscout.
9. **Operate** — monitoring (events, Defender/Forta), admin actions via multisig + timelock, incident response (pause).
10. **Upgrade or migrate** — through a proxy (if designed) or by deploying a new contract and migrating state.

**Contract execution lifecycle (per call):** transaction/call reaches the contract → EVM loads bytecode → function selector (first 4 bytes of calldata = `keccak256("transfer(address,uint256)")[0:4]`) dispatches to the function → modifiers run → body executes reading/writing **storage**, using **memory**/**stack**, possibly calling other contracts → emits events → returns data, or **reverts** (all state changes undone, remaining gas returned except for what was used).

**Contract lifecycle on-chain:** creation transaction runs the **constructor** (init code) → runtime bytecode stored at the new address → used via calls → (legacy `selfdestruct` is effectively disabled since Dencun/EIP-6780 except within the same transaction as creation).

# Tools

| Tool | Use |
|---|---|
| **Remix IDE** (remix.ethereum.org) | Browser IDE — learning, quick tests |
| **Foundry** (forge, cast, anvil, chisel) | Rust-based toolkit; tests in Solidity; fast fuzzing |
| **Hardhat** (v3) | JS/TS toolkit; plugins; Hardhat Network; Ignition deployments |
| **OpenZeppelin Contracts / Wizard / Upgrades plugin / Defender** | Audited contracts, generator, proxy tooling, ops |
| solc, solc-select | Compiler versions |
| **Slither**, Mythril, Aderyn | Static analysis |
| Echidna, Medusa, Foundry invariant tests | Fuzzing |
| Certora, Halmos, SMTChecker | Formal verification / symbolic execution |
| Tenderly | Debugging, simulation, monitoring |
| Etherscan / Blockscout | Verification, reading contracts |
| VS Code + Solidity extension (Nomic Foundation/Juan Blanco) | Editing |

# Module: Language Basics

## Lesson: [Basic|High] Contract structure, state variables and types

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleBank {
    // ---- state variables (stored on-chain) ----
    address public immutable owner;            // set once in constructor, stored in bytecode (cheap to read)
    uint256 public constant MIN_DEPOSIT = 0.01 ether;   // compile-time constant
    uint256 public totalDeposits;
    mapping(address => uint256) public balances;        // public → auto-generated getter
    bool private paused;

    // ---- events & errors ----
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    error InsufficientBalance(uint256 requested, uint256 available);
    error NotOwner();

    constructor() {
        owner = msg.sender;                    // deployer
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;                                     // continue with the function body
    }

    function deposit() external payable {
        require(msg.value >= MIN_DEPOSIT, "Deposit too small");
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        uint256 bal = balances[msg.sender];
        if (amount > bal) revert InsufficientBalance(amount, bal);
        balances[msg.sender] = bal - amount;   // update state BEFORE the external call (checks-effects-interactions)
        totalDeposits -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function setPaused(bool p) external onlyOwner { paused = p; }
}
```

**Value types:** `bool`, `uint8…uint256` (`uint` = `uint256`), `int8…int256`, `address` (20 bytes) / `address payable`, `bytes1…bytes32`, `enum`. **Reference types:** arrays (`uint[]`, `uint[10]`), `bytes`, `string`, `struct`, `mapping(K => V)` (no iteration, no length; every key exists with a default zero value).

**Units:** `1 ether = 1e18 wei`, `gwei`; time units `seconds`, `minutes`, `hours`, `days`, `weeks`. No floating point — use integers with fixed decimals.

**Global variables:** `msg.sender` (immediate caller), `msg.value` (wei sent), `msg.data`, `block.timestamp`, `block.number`, `block.chainid`, `tx.origin` (original EOA — never use for auth), `gasleft()`, `address(this).balance`.

## Lesson: [Basic|High] Functions: visibility, state mutability and modifiers

| Visibility | Callable from |
|---|---|
| `public` | Anywhere (internally and externally); public state vars get getters |
| `external` | Only from outside (other contracts/EOAs), or `this.f()` |
| `internal` | This contract and derived contracts (default for state variables) |
| `private` | Only this contract (still **visible on-chain** — not secret!) |

| Mutability | Meaning |
|---|---|
| (none) | Can read and modify state |
| `view` | Reads state, doesn't modify |
| `pure` | Neither reads nor modifies state |
| `payable` | Can receive Ether |

```solidity
function quote(uint256 qty) public view returns (uint256 price) { price = qty * unitPrice; }
function add(uint256 a, uint256 b) external pure returns (uint256) { return a + b; }

receive() external payable { }                       // plain Ether transfers (empty calldata)
fallback() external payable { }                      // unknown function selector (or Ether with data)
```

**Modifiers** wrap function logic (access control, state checks, reentrancy guard). **Function overloading** is allowed. Calls to `view`/`pure` functions from off-chain (`eth_call`) are free; when called inside a transaction they still cost gas.

## Lesson: [Basic|High] Data locations: storage, memory, calldata, stack and transient

| Location | Lifetime | Cost | Notes |
|---|---|---|---|
| **storage** | Permanent (contract state) | Most expensive (SSTORE ~20,000 gas for a new non-zero slot, 2,900–5,000 for updates; reads ~2,100 cold / 100 warm) | State variables; storage pointers |
| **memory** | During the function call | Cheap, grows quadratically | Temporary arrays/structs, function params of public functions |
| **calldata** | Read-only input of external calls | Cheapest for inputs | Use for `external` function array/string params |
| **stack** | Local value-type variables | Cheapest | 1024 slots max depth; "stack too deep" with too many locals |
| **transient** (EIP-1153, Solidity 0.8.28+) | Until end of the transaction | Cheap | Reentrancy locks, temporary approvals |

```solidity
struct Order { address buyer; uint96 amount; bool paid; }
Order[] public orders;

function markPaid(uint256 id) external {
    Order storage o = orders[id];     // reference to storage → modifies state
    o.paid = true;
}
function preview(uint256 id) external view returns (Order memory) {
    Order memory o = orders[id];      // copy into memory → changes would NOT persist
    return o;
}
function sum(uint256[] calldata xs) external pure returns (uint256 t) {
    for (uint256 i; i < xs.length; ++i) t += xs[i];
}
```

## Lesson: [Intermediate|High] Errors, require, revert, assert and events

```solidity
error Unauthorized(address caller);
error InsufficientFunds(uint256 needed, uint256 available);

function pay(uint256 amount) external {
    require(amount > 0, "Zero amount");                         // input validation (string costs more gas)
    if (balance[msg.sender] < amount) revert InsufficientFunds(amount, balance[msg.sender]);   // custom error (0.8.4+), cheapest
    assert(totalSupply >= balance[msg.sender]);                 // invariants that should NEVER fail (Panic error)
}

// try/catch for external calls
try oracle.latestPrice() returns (uint256 p) { price = p; }
catch Error(string memory reason) { emit OracleFailed(reason); }
catch (bytes memory) { emit OracleFailed("unknown"); }
```

On revert, **all state changes in the call are undone**; gas used so far is consumed. **Events** (`emit Transfer(from, to, amount)`) write to transaction logs — cheap, not readable by contracts, but indexed by off-chain apps; up to 3 `indexed` parameters become searchable topics.

# Module: Object-Oriented Solidity

## Lesson: [Intermediate|High] Inheritance, interfaces, abstract contracts and libraries

```solidity
interface IPriceFeed {                               // no implementation, all functions external
    function latestPrice() external view returns (uint256);
}

abstract contract Pausable {                         // can't be deployed; may have unimplemented functions
    bool public paused;
    modifier whenNotPaused() { require(!paused, "Paused"); _; }
    function _pause() internal virtual { paused = true; }
}

contract Shop is Pausable, Ownable {                 // multiple inheritance, C3 linearization (right-most is most derived)
    constructor() Ownable(msg.sender) {}
    function pause() external onlyOwner { _pause(); }
    function _pause() internal override { super._pause(); emit ShopPaused(); }   // virtual/override, super
    event ShopPaused();
}

library MathLib {                                    // reusable code; internal functions are inlined
    function percent(uint256 x, uint256 bps) internal pure returns (uint256) { return x * bps / 10_000; }
}
using MathLib for uint256;                           // attach: amount.percent(250)
```

Functions must be marked `virtual` to be overridable and `override` when overriding. Interfaces enable calling other contracts: `IERC20(token).transfer(to, amt)`.

## Lesson: [Intermediate|High] ERC-20 and ERC-721 with OpenZeppelin

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DivakarToken is ERC20, ERC20Permit, Ownable {
    constructor(address initialOwner) ERC20("Divakar Token", "DVK") ERC20Permit("Divakar Token") Ownable(initialOwner) {
        _mint(initialOwner, 1_000_000 * 10 ** decimals());   // 18 decimals by default
    }
    function mint(address to, uint256 amount) external onlyOwner { _mint(to, amount); }
}
```

```solidity
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract CourseCertificate is ERC721, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    uint256 private _nextId = 1;
    string private _base;

    constructor(string memory baseUri) ERC721("Course Certificate", "CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _base = baseUri;                                     // e.g. ipfs://<CID>/
    }
    function issue(address student) external onlyRole(ISSUER_ROLE) returns (uint256 id) {
        id = _nextId++;
        _safeMint(student, id);
    }
    function _baseURI() internal view override returns (string memory) { return _base; }
    function supportsInterface(bytes4 id) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(id);
    }
}
```

Use **OpenZeppelin** instead of writing token logic yourself — audited, standard-compliant. **Ownable** (single owner) vs **AccessControl** (roles) vs **AccessManager** (centralised permissions, OZ 5).

## Lesson: [Intermediate|High] Sending and receiving Ether safely

```solidity
// Recommended: call with checks-effects-interactions + reentrancy guard
(bool ok, ) = payable(to).call{value: amount}("");
require(ok, "ETH transfer failed");

// transfer/send forward only 2,300 gas — can break with smart-contract wallets; generally avoid
payable(to).transfer(amount);            // reverts on failure
bool sent = payable(to).send(amount);    // returns false on failure
```

**Pull over push:** instead of sending Ether to many users in a loop (one failing recipient blocks everyone; gas limits), record balances and let each user `withdraw()`.

# Module: Advanced Topics

## Lesson: [Advanced|High] Security vulnerabilities and defences

| Vulnerability | What happens | Defence |
|---|---|---|
| **Reentrancy** | External call re-enters your function before state is updated (The DAO, 2016) | **Checks-Effects-Interactions**, `ReentrancyGuard` (`nonReentrant`), pull payments |
| Access control bugs | Missing `onlyOwner`/role checks, unprotected `initialize` | Explicit modifiers, tests for every privileged function, OZ AccessControl |
| `tx.origin` auth | Phishing contract calls yours on behalf of the user | Use `msg.sender` |
| Integer overflow | Pre-0.8 wrap-around (BEC token 2018) | Solidity ≥ 0.8 (checked), careful `unchecked` |
| Oracle manipulation | Spot price from one pool manipulated (often with flash loans) | Chainlink/TWAP, multiple sources, sanity bounds |
| Front-running / MEV | Attackers see pending txs and reorder | Commit-reveal, slippage limits, batch auctions |
| Denial of service | Unbounded loops, failing recipient blocks payouts | Pagination, pull payments, avoid loops over user arrays |
| Signature replay | Same signature reused (other chain/contract/after use) | Nonces, `chainid`, EIP-712 domain separator, deadlines |
| Unchecked return values | Ignoring `call` result or non-standard ERC-20s (USDT returns nothing) | Check `ok`; use **SafeERC20** |
| `delegatecall` / proxy storage collisions | Logic contract overwrites proxy storage | OZ upgradeable patterns, storage gaps / ERC-7201 namespaced storage, `_disableInitializers()` |
| Randomness | `block.timestamp`/`prevrandao` predictable/influenceable | Chainlink VRF |
| Precision loss | Divide before multiply | Multiply first, use fixed-point libraries |
| Private data | `private` vars readable from storage | Never store secrets on-chain; commit hashes |

```solidity
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Vault is ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable token;
    mapping(address => uint256) public shares;
    constructor(IERC20 t) { token = t; }

    function withdraw(uint256 amount) external nonReentrant {
        require(shares[msg.sender] >= amount, "Too much");   // checks
        shares[msg.sender] -= amount;                         // effects
        token.safeTransfer(msg.sender, amount);               // interactions
    }
}
```

## Lesson: [Advanced|Medium] Upgradeable contracts (proxy patterns)

Contracts are immutable, so upgradeability uses a **proxy** that holds storage and **delegatecalls** into a replaceable **implementation** (logic) contract.

| Pattern | Upgrade logic lives in | Notes |
|---|---|---|
| **Transparent proxy** | Proxy (admin via ProxyAdmin) | Admin can't call logic functions; slightly more gas |
| **UUPS** (ERC-1822) | Implementation (`upgradeTo` + `_authorizeUpgrade`) | Cheaper; risk of bricking if an upgrade removes upgrade logic |
| Beacon proxy | Beacon contract shared by many proxies | Upgrade many instances at once |
| Diamond (ERC-2535) | Multiple facets | Very large/modular systems; complex |

Rules: use **initializers** instead of constructors (`initialize()` with `initializer` modifier; call `_disableInitializers()` in the implementation's constructor), never change the order/types of existing storage variables (append only, or use ERC-7201 namespaced storage), protect upgrades with a **multisig + timelock**, and validate with the OpenZeppelin Upgrades plugin. Upgradeability trades trustlessness for fixability — be transparent with users.

## Lesson: [Advanced|Medium] Gas optimisation

1. Minimise **storage writes**; cache storage reads in local variables (`uint256 bal = balances[a];`).
2. **Pack** variables into 32-byte slots (`uint128 a; uint128 b;` share one slot; order struct fields by size).
3. `constant` and `immutable` for fixed values (no storage reads).
4. `calldata` instead of `memory` for external read-only params.
5. **Custom errors** instead of revert strings.
6. Use `mapping` over arrays for lookups; avoid unbounded loops.
7. `unchecked { ++i; }` in loops where overflow is impossible; `++i` vs `i++` (minor).
8. Emit events instead of storing data that only off-chain apps need.
9. Short-circuit conditions (cheap checks first); `external` over `public` for functions not called internally (minor in modern compilers).
10. Batch operations; use transient storage for in-transaction flags.
11. Enable the optimizer (`runs` tuned: low for deploy cost, high for call cost); compare with `forge snapshot` / gas reports.

Readability and security beat micro-optimisation — measure first.

## Lesson: [Intermediate|High] Testing with Foundry and Hardhat, deployment

```solidity
// test/SimpleBank.t.sol (Foundry)
import {Test} from "forge-std/Test.sol";
import {SimpleBank} from "../src/SimpleBank.sol";

contract SimpleBankTest is Test {
    SimpleBank bank;
    address alice = makeAddr("alice");

    function setUp() public { bank = new SimpleBank(); vm.deal(alice, 10 ether); }

    function test_DepositAndWithdraw() public {
        vm.startPrank(alice);
        bank.deposit{value: 1 ether}();
        bank.withdraw(0.4 ether);
        vm.stopPrank();
        assertEq(bank.balances(alice), 0.6 ether);
    }

    function test_RevertWhen_WithdrawTooMuch() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SimpleBank.InsufficientBalance.selector, 1 ether, 0));
        bank.withdraw(1 ether);
    }

    function testFuzz_Deposit(uint96 amount) public {               // fuzzing: random inputs
        vm.assume(amount >= 0.01 ether && amount <= 10 ether);
        vm.prank(alice);
        bank.deposit{value: amount}();
        assertEq(bank.totalDeposits(), amount);
    }
}
```

```bash
forge init bank && forge build && forge test -vvv
forge test --gas-report && forge coverage
anvil                                                          # local node
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC --account deployer --broadcast --verify
cast call <address> "balances(address)(uint256)" <alice> --rpc-url $SEPOLIA_RPC

# Hardhat alternative
npx hardhat test
npx hardhat ignition deploy ./ignition/modules/Bank.ts --network sepolia --verify
```

Test types: unit, **fuzz**, **invariant** (properties that must always hold across random call sequences), **fork tests** (against real mainnet state), integration with frontends. Keep deployer keys in an encrypted keystore or hardware wallet — never in `.env` committed to Git.

# Interview

## [Beginner|High] What is Solidity and what is the EVM?

Solidity is a statically typed, contract-oriented programming language for writing smart contracts that run on the Ethereum Virtual Machine. The EVM is the sandboxed, deterministic, stack-based virtual machine that every Ethereum node runs to execute contract bytecode identically, metering each operation in gas. Solidity compiles to EVM bytecode plus an ABI used by clients to call contract functions.

## [Beginner|High] Explain function visibility in Solidity.

`public` — callable internally and externally (state variables get automatic getters). `external` — callable only from outside the contract (or via `this.`). `internal` — this contract and contracts that inherit from it (default for state variables). `private` — only this contract. Note: `private` doesn't hide data — all on-chain storage is publicly readable.

## [Beginner|High] What is the difference between view and pure functions?

`view` functions can read state but not modify it; `pure` functions neither read nor modify state (only use their inputs and local variables). Both are free when called off-chain via `eth_call`, but cost gas when called from within a transaction. The compiler enforces these restrictions.

## [Beginner|High] What are storage, memory and calldata?

They're data locations. `storage` is persistent contract state on the blockchain (expensive to write). `memory` is temporary, modifiable data that exists for the duration of a function call. `calldata` is a read-only, non-persistent area holding the arguments of external calls — the cheapest choice for external function array/string/struct parameters. Assigning storage to a local `storage` variable creates a reference; to `memory` creates a copy.

## [Beginner|High] What is msg.sender vs tx.origin?

`msg.sender` is the immediate caller of the current function — an EOA or another contract. `tx.origin` is always the EOA that originally signed the transaction. Using `tx.origin` for authorisation is a vulnerability: a malicious contract the user interacts with can call your contract and pass a `tx.origin == owner` check. Always use `msg.sender`.

## [Beginner|Medium] What are events and why use them?

Events (`event Transfer(address indexed from, address indexed to, uint256 value)`) emitted with `emit` are stored in transaction logs, not contract storage — much cheaper. Off-chain apps (frontends, indexers, The Graph, .NET backends) subscribe to and filter them (up to 3 `indexed` topics). Contracts can't read logs. Use them for activity history, notifications and indexing.

## [Intermediate|High] What is a reentrancy attack and how do you prevent it?

When a contract makes an external call (e.g. sending Ether) before updating its own state, the recipient's code (fallback/receive or a token hook) can call back into the contract and repeat the action — for example withdrawing again before the balance is reduced (The DAO hack, 2016, ~3.6M ETH). Prevent it with the Checks-Effects-Interactions pattern (validate, update state, then call out), OpenZeppelin `ReentrancyGuard` (`nonReentrant`), pull-payment designs, and care with token callbacks (ERC-777/721/1155 hooks).

## [Intermediate|High] require vs revert vs assert vs custom errors?

`require(cond, "msg")` validates inputs/conditions and reverts with an Error(string). `revert CustomError(args)` (or `revert("msg")`) aborts explicitly, often after an `if`. Custom errors (0.8.4+) are cheaper (4-byte selector + args instead of strings) and carry structured data. `assert(cond)` checks internal invariants that should never be false; failure raises a Panic error and indicates a bug. All revert all state changes in the call.

## [Intermediate|High] How do you send Ether from a contract? transfer vs send vs call?

`transfer` forwards 2,300 gas and reverts on failure; `send` forwards 2,300 gas and returns false on failure; `call{value: x}("")` forwards all available gas (configurable) and returns (success, data). Since gas costs changed (EIP-1884) and smart-contract wallets need more gas, `call` with a checked return value is recommended — combined with reentrancy protection and the pull-payment pattern.

## [Intermediate|High] What changed in Solidity 0.8?

Arithmetic is checked by default: overflow/underflow reverts (Panic 0x11) instead of silently wrapping, making SafeMath unnecessary; `unchecked { }` blocks opt out for gas savings where safe. ABI coder v2 became the default. Later 0.8.x versions added custom errors (0.8.4), user-defined value types, `bytes.concat`/`string.concat`, named mapping parameters, user-defined operators and transient storage (0.8.28).

## [Intermediate|Medium] What is the difference between an interface, an abstract contract and a library?

An interface declares only external function signatures (no state, no implementation, no constructor) — used to interact with other contracts and define standards (IERC20). An abstract contract can contain state and implemented functions but has at least one unimplemented function or is marked abstract — it can't be deployed, only inherited. A library holds reusable functions without state (internal functions are inlined; public ones are deployed and called via delegatecall), attached to types with `using X for Y`.

## [Intermediate|Medium] What are modifiers? Give an example.

Reusable code that runs before and/or after a function body, where `_` marks where the body executes. Typical uses: access control (`onlyOwner`, `onlyRole`), state checks (`whenNotPaused`), reentrancy guards, input validation. Example: `modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }`.

## [Advanced|High] How do upgradeable contracts work? What are the risks?

A proxy contract holds the state and forwards calls using `delegatecall` to an implementation contract, which runs in the proxy's storage context; upgrading means pointing the proxy to a new implementation (Transparent, UUPS, Beacon patterns). Risks: storage layout collisions if variables are reordered, uninitialised implementations being taken over (use `_disableInitializers`), forgetting to protect the upgrade function, a malicious or compromised admin (mitigate with multisig + timelock), and loss of the "code is law" guarantee for users.

## [Advanced|High] How do you reduce gas costs in a contract?

Reduce storage writes and reads (cache in memory/stack), pack variables into 32-byte slots, use `constant`/`immutable`, `calldata` for external inputs, custom errors, mappings instead of array searches, avoid unbounded loops, use `unchecked` where overflow can't happen, emit events instead of storing off-chain-only data, batch operations, transient storage for per-transaction flags, and tune the optimizer. Measure with gas reports/snapshots and never trade away safety.

## [Advanced|Medium] Why is on-chain randomness hard, and how do you get it?

Everything on-chain is deterministic and visible: `block.timestamp`, `blockhash` and `block.prevrandao` can be predicted or influenced by validators/attackers, and users can revert transactions with unfavourable outcomes. Use a verifiable random function oracle (Chainlink VRF) that provides randomness with a cryptographic proof, or commit-reveal schemes among multiple parties.

## [Advanced|Medium] What is the difference between call, delegatecall and staticcall?

`call` executes code in the target contract's context (its storage; `msg.sender` becomes the caller contract) and can send Ether. `delegatecall` executes the target's code in the **caller's** context (caller's storage, `msg.sender` and `msg.value` preserved) — used by proxies and libraries; dangerous with untrusted targets. `staticcall` is like call but reverts on any state modification — used for view calls.

## [Scenario|High] You must build a token sale contract that accepts USDC and gives buyers your token. What would you check for security?

Use OpenZeppelin ERC-20 and `SafeERC20` (`safeTransferFrom` for USDC); handle decimals correctly (USDC has 6, your token 18); checks-effects-interactions plus `nonReentrant`; caps per wallet and a total cap; start/end times; pausable by a multisig; no reliance on spot prices; no unbounded loops (let users claim — pull, not push); withdrawal of raised funds only by the treasury multisig; events for every purchase; comprehensive unit/fuzz tests including edge cases (zero amounts, rounding); an external audit; and legal/compliance review (securities rules, KYC).

## [Scenario|High] A deployed contract has a bug that can drain funds, and it's not upgradeable. What do you do?

Act immediately: if it has a pause or emergency-withdraw function controlled by a multisig, use it; otherwise consider a white-hat rescue (exploit it yourself first to move funds to safety, coordinated with security firms such as SEAL 911), notify users and integrators to stop interacting, revoke approvals guidance, coordinate with exchanges/bridges to freeze stolen funds where possible, then deploy a fixed contract, migrate state from a snapshot, compensate users if possible, and publish a post-mortem. Prevention: audits, bug bounties, pausability, rate limits and monitoring.

## [Scenario|Medium] Your NFT mint is expensive and fails for some buyers because of gas. How do you improve it?

Optimise the mint: avoid storing per-token data that can be computed or kept off-chain (use a base URI + token ID), use ERC721A or similar batch-mint-optimised implementations for multi-mints, pack storage, use custom errors, and remove loops over all holders; use a Merkle-proof allowlist instead of storing whitelists on-chain; deploy on a layer 2 (Base, Arbitrum) for much lower fees; and test gas usage with Foundry gas reports before launch.

# Cheatsheet

## Skeleton

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract C is Parent {
    uint256 public x; address public immutable owner; uint256 constant MAX = 100;
    mapping(address => uint256) public bal;
    event Did(address indexed who, uint256 v);
    error Nope(uint256 code);
    modifier onlyOwner() { if (msg.sender != owner) revert Nope(1); _; }
    constructor() { owner = msg.sender; }
    function f(uint256 a) external payable onlyOwner returns (uint256) { emit Did(msg.sender, a); return a; }
    receive() external payable {}
}
```

## Visibility & mutability

public · external · internal · private (still readable on-chain) · view · pure · payable.

## Data locations

storage (persistent, costly) · memory (temporary) · calldata (read-only inputs, cheapest) · stack · transient (per-tx, 0.8.28).

## Errors

`require` · `revert CustomError()` · `assert` (Panic) · try/catch for external calls · all state rolled back.

## Security checklist

CEI + `nonReentrant` · `msg.sender` not `tx.origin` · access control on every admin function · SafeERC20 · no spot-price oracles · no unbounded loops · pull payments · nonces + chainid in signatures · Chainlink VRF for randomness · initializers + `_disableInitializers` for proxies · multisig + timelock · audits + fuzzing.

## Gas tips

Fewer SSTOREs · cache reads · pack slots · constant/immutable · calldata · custom errors · unchecked loops · events over storage · optimizer.

## Tooling

Remix · Foundry (forge/cast/anvil) · Hardhat · OpenZeppelin · Slither · Echidna · Tenderly · Etherscan verify · Sepolia.

## Versions

0.5 explicit locations · 0.6 virtual/override, receive/fallback · **0.8 checked math** · 0.8.4 custom errors · 0.8.28 transient storage · OpenZeppelin 5.x.
