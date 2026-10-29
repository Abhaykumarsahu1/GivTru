# 🌱 Givtru: Transparent Giving, Powered by Blockchain

Givtru is a decentralized charity platform where every donation, vote and fund release is recorded on-chain, and where no campaigner can ever touch the money alone.

Donors send funds directly to a smart contract, not to a person or a company. Money can only leave that contract when a board of independent trustees approves a specific withdrawal request by a **two-thirds supermajority**. If a campaign misses its goal by the deadline, **donors can claim their money back** without anyone's permission.

**🔗 Live app:** https://giv-tru.vercel.app

---

## Table of contents

1. [The problem](#the-problem)
2. [The solution](#the-solution)
3. [Key features](#key-features)
4. [Deployed contracts](#deployed-contracts)
5. [On-chain proof: MST Testnet transactions](#on-chain-proof-mst-testnet-transactions)
6. [Smart contract overview](#smart-contract-overview)
7. [Tech stack](#tech-stack)
8. [Project structure](#project-structure)
9. [Setup guide](#setup-guide)
10. [Security](#security)

---

## The problem

Charity and crowdfunding run on trust, and traditional platforms ask donors to give it blindly:

- **Opaque spending:** once a donation is made, donors rarely see how it is used. Updates are whatever the organizer chooses to post.
- **Single point of control:** the organizer (or the platform) controls the funds. A dishonest organizer can withdraw everything, and a platform can freeze or redirect money.
- **Fees and intermediaries:** platform fees, payment processing and bank transfers take a cut of every donation. International giving adds delays and conversion costs.
- **No built-in refund guarantee:** if a campaign fails or stalls, getting money back depends on platform policy and goodwill.
- **Fraud and verification burden:** fake campaigns are hard to spot, and donors carry the risk.
- **Closed records:** the ledger belongs to the platform, so donors cannot audit it independently.

Many existing crypto crowdfunding tools fix only part of this. They simply forward funds to the organizer's wallet, which gives on-chain transfers but still lets one person drain the money.

## The solution

Givtru moves trust from people to code.

- Funds are held by each campaign's **smart contract**, not by any individual.
- Withdrawals need a **public request** (description and amount) and a **two-thirds vote** from the campaign's board.
- If the goal is not met by the deadline, the contract lets **every donor reclaim their own donation**.
- Everything is public and verifiable on the block explorer.

**Who it is for**

| User | Why they use Givtru |
|---|---|
| Donors | Proof of where their money goes, and a refund guarantee |
| Campaigners (NGOs, community groups, individuals) | Credibility: donors know funds are governed by a board |
| Board members (trustees) | A clear, on-chain role overseeing spending |
| Communities with costly cross-border giving | Low fees and no bank intermediaries |

---

## Key features

- **Campaign factory:** anyone can launch a campaign with a title, description, image, goal, deadline and board.
- **Multi-signature-style board governance:** each campaign has 3 to 10 board members. A withdrawal request needs approval from two-thirds of the board, rounded up (for example 2 of 3, 4 of 5). A two-thirds rejection closes the request permanently. Each member votes once per request.
- **Controlled withdrawals:** the campaigner submits a request with a description and an amount. Funds are released automatically the moment the approval threshold is reached, and not before.
- **Claim refunds:** if the deadline passes and the goal is not met, any donor can reclaim their own contribution. The contract tracks each donor's amount.
- **Campaign lifecycle:** Active, Expired and Closed states, updated lazily on the next interaction.
- **Minimum donation** and live goal tracking, with a progress bar and donor list.
- **IPFS image storage** (via Pinata) for campaign images.
- **Multi-wallet connect (EIP-6963):** the connect screen lists whatever wallets are installed: **MetaMask, Phantom and BridgeKey**.
- **Multi-chain frontend:** a navbar network dropdown for Arbitrum Sepolia, MST Testnet and MST Mainnet. It switches the wallet's network automatically and shows the right coin symbol (ETH, tMSTC, MSTC) and explorer links.
- **Role-aware dashboards:** separate views for donors, campaigners and board members. The Board button appears automatically when the connected wallet is a trustee on any campaign.

---

### Network details

| Network | Chain ID | Symbol | RPC | Explorer |
|---|---|---|---|---|
| MST Mainnet | 4646 | MSTC | https://mariorpc.mstblockchain.com/ | https://mstscan.com |
| MST Testnet | 91562037 | tMSTC | https://testnetrpc.mstblockchain.com | https://testnet.mstscan.com |
| Arbitrum Sepolia | 421614 | ETH | https://sepolia-rollup.arbitrum.io/rpc | https://sepolia.arbiscan.io |

---

## Deployed contracts

| Network | Contract | Address | Deploy tx |
|---|---|---|---|
| **MST Mainnet** (4646) | CampaignFactory | [`0x1565efF66ed51176901B8a2A227359d31B9A0763`](https://mstscan.com/address/0x1565efF66ed51176901B8a2A227359d31B9A0763) | [`0x31d9d9d7…411c00`](https://mstscan.com/tx/0x31d9d9d79803d1521294e09113d817fe42830ce6135ca4bff429d73903411c00) |
| **MST Testnet** (91562037) | CampaignFactory | [`0xD7AE608c9E3cEFa533Dc48073DD50C3393ca37DE`](https://testnet.mstscan.com/address/0xD7AE608c9E3cEFa533Dc48073DD50C3393ca37DE) | [`0xf14ebc6e…f48`](https://testnet.mstscan.com/tx/0xf14ebc6edf7ad4da82a5999d49aab7c67533a481888236dc9bd5f99a3760ef48) |
| MST Testnet | Campaign (example) | [`0x3041D3013884d4F33671b265C6c98BF15DbBcE39`](https://testnet.mstscan.com/address/0x3041D3013884d4F33671b265C6c98BF15DbBcE39) | created via the factory |
| Arbitrum Sepolia (421614) | CampaignFactory | [`0xe949072287326873587CC7996a56ed2C1e42f460`](https://sepolia.arbiscan.io/address/0xe949072287326873587cc7996a56ed2c1e42f460) | verified on Arbiscan |

Each campaign is its own `Campaign` contract, deployed by the factory when a campaign is created.

---

## On-chain proof: MST Testnet transactions

The complete campaign lifecycle was executed on MST Testnet. Every hash below can be checked on https://testnet.mstscan.com.

| # | Step | What happened | Transaction |
|---|---|---|---|
| 1 | Deploy | CampaignFactory deployed | [`0xf14ebc6e…f48`](https://testnet.mstscan.com/tx/0xf14ebc6edf7ad4da82a5999d49aab7c67533a481888236dc9bd5f99a3760ef48) |
| 2 | Create campaign | First campaign created through the factory at [`0x3041…cE39`](https://testnet.mstscan.com/address/0x3041D3013884d4F33671b265C6c98BF15DbBcE39) | see the factory's transactions on the explorer |
| 3 | Donate | A donor funded the first campaign | [`0x10ec42a8…6a60`](https://testnet.mstscan.com/tx/0x10ec42a8d4958c809092d045ff0dfe65f5793ae0c6c0c9d75c64f3223ccd6a60) |
| 4 | Withdrawal request | The campaigner submitted a withdrawal request from the dashboard | [`0x7696f5c6…ffa4`](https://testnet.mstscan.com/tx/0x7696f5c62060761324cbf3e02681ec68b405fcf93580b99f537fed1f5b05ffa4) |
| 5 | Board vote 1 | First board member approved | [`0x0480209d…04a2`](https://testnet.mstscan.com/tx/0x0480209dd3b645cd3e180d224e4ad76a8a19ca9d425e66288c3c4a6cff1b04a2) |
| 6 | Board vote 2 and release | Second board member approved. The 2-of-3 threshold was reached, so the contract **released the funds to the campaigner in the same transaction** | [`0x104f9cc9…1bcc`](https://testnet.mstscan.com/tx/0x104f9cc99432d7ad6ba79d35710fd9a72c4a46e8d99f78e9bf85b19412421bcc) |
| 7 | Claim refund | On a campaign that expired below its goal, a donor reclaimed their 0.5 tMSTC | [`0xb1b18f29…3a4c`](https://testnet.mstscan.com/tx/0xb1b18f2919d2d3e28f7b2952f057db5dd90c8a97a060f16e9b61836a60e53a4c) |

**Governance in action:** the request went to a 3-member board. Two of the three approved, which meets the two-thirds supermajority, and the contract released the funds automatically.

### MST Mainnet

Contract address of CampaignFactory:  0x1565efF66ed51176901B8a2A227359d31B9A0763

---

## Smart contract overview

### `CampaignFactory`
| Function | Purpose |
|---|---|
| `createCampaign(title, description, ipfsHash, goal, deadline, boardMembers)` | Deploys a new `Campaign` contract, records it and emits an event |
| `getAllCampaigns()` | Returns every campaign address |
| `getCampaignsByCampaigner(address)` | Returns the campaigns created by a wallet |

### `Campaign` (one per campaign)
| Function | Who can call | Purpose |
|---|---|---|
| `donate()` payable | Anyone | Accepts the native coin while the campaign is active and the amount meets the minimum (0.01). Records the donor's contribution |
| `createWithdrawalRequest(description, amount)` | Campaigner | Creates a pending request. The amount cannot exceed the contract balance |
| `voteOnRequest(requestId, approve)` | Board members, once per request | Records a vote. At the two-thirds threshold, `_executeRequest` runs: approval transfers the funds to the campaigner, rejection closes the request |
| `claimRefund()` | Donors | After the deadline, if the goal was not met, returns the caller's own donation. The donation is zeroed first |
| `isBoardMember`, `getBoardMembers`, `getDonorCount`, `donorList`, `donations`, `getTotalRequests`, `requests`, `getContractBalance` | Anyone | Read functions used by the frontend |

**Threshold formula:** `(2 * boardSize + 2) / 3` (ceiling division). Minimum board size is 3.

---

## Tech stack

| Layer | Technology |
|---|---|
| Smart contracts | Solidity ^0.8.19, OpenZeppelin (ReentrancyGuard) |
| Contract tooling | Foundry (forge): build, test, fuzz, deploy |
| Frontend | React + Vite, ethers.js v6, React Router |
| Wallets | MetaMask, Phantom, BridgeKey (via EIP-6963 discovery) |
| Storage | IPFS via Pinata (campaign images) |
| Networks | MST Mainnet, MST Testnet, Arbitrum Sepolia |
| Hosting | Vercel (auto-deploys on push) |

---

## Project structure

```
Givtru/
├── contracts/                 # Foundry project
│   ├── src/                   # Campaign.sol, CampaignFactory.sol
│   ├── test/                  # 26 tests: unit, fuzz, reentrancy, access control
│   ├── script/Deploy.s.sol    # DeployGivTru
│   └── foundry.toml
└── frontend/GivTru/           # React + Vite app
    └── src/
        ├── components/        # Navbar, WalletModal, WelcomeModal, CampaignCard
        ├── context/           # WalletContext (wallet, network, factory address)
        ├── contracts/         # ABIs and networks.js (per-chain config)
        ├── hooks/             # useContract, useWalletDiscovery (EIP-6963)
        ├── pages/             # Landing, DonorDashboard, CampaignDetail,
        │                      # CampaignerRegister, CampaignerDashboard,
        │                      # BoardHome, BoardDashboard
        └── utils/             # IPFS helpers
```

---

## Setup guide

### Prerequisites
- Node.js 18+ and npm
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- A browser wallet: MetaMask, Phantom or [BridgeKey](https://bridgekey.io)
- Test coins: tMSTC from the MST Testnet faucet (linked in the MST developer docs)

### 1. Clone

```bash
git clone https://github.com/Abhaykumarsahu1/Givtru.git
cd Givtru
```

### 2. Smart contracts

```bash
cd contracts
forge install
forge build
forge test        # runs all 26 tests
```

Create `contracts/.env` (never commit this file):

```env
PRIVATE_KEY=0x...                                   # deployer key (use a dedicated wallet)
MST_TESTNET_RPC=https://testnetrpc.mstblockchain.com
MST_MAINNET_RPC=https://mariorpc.mstblockchain.com/
ARBITRUM_RPC_URL=...                                # optional, for Arbitrum Sepolia
ARBISCAN_API_KEY=...                                # optional, for verification
```

Deploy to **MST Testnet**:

```bash
source .env
forge script script/Deploy.s.sol:DeployGivTru --rpc-url $MST_TESTNET_RPC --broadcast -vvvv
```

Deploy to **MST Mainnet**:

```bash
forge script script/Deploy.s.sol:DeployGivTru --rpc-url $MST_MAINNET_RPC --broadcast --legacy --with-gas-price 2000000000 -vvvv
```

> **Note on MST mainnet gas:** Foundry's default fee estimate for MST mainnet comes out far below the network's minimum gas price (about 1 gwei), so the transaction sits pending. Passing `--legacy --with-gas-price 2000000000` (2 gwei) avoids this.

Copy the printed factory address into the matching network entry in `frontend/GivTru/src/contracts/networks.js`.

### 3. Frontend

```bash
cd frontend/GivTru
npm install
```

Create `frontend/GivTru/.env` with your Pinata credentials for image uploads (see `src/utils/ipfs.js` for the variable names it reads). Then:

```bash
npm run dev        # http://127.0.0.1:5173
npm run build      # production build
```

### 4. Try it

1. Open the app and click **Connect Wallet**, then choose BridgeKey, MetaMask or Phantom.
2. Pick **MST Testnet** or **MST Mainnet** from the navbar dropdown. The app adds the network to your wallet if needed.
3. **Start Campaign:** fill in the details, add at least three distinct board wallets, then launch.
4. **Browse Campaigns** and donate (minimum 0.01).
5. From **My Dashboard**, create a withdrawal request.
6. Connect as a board member, open the **Board** page and vote. At two-thirds approval, the funds are released.
7. On a campaign that expired below its goal, donors see a **Claim Refund** card.

---

## Security

- **ReentrancyGuard** on value-moving functions, plus the **checks-effects-interactions** pattern (state is updated before any transfer).
- **Role checks:** only the campaigner can create requests, only board members can vote, each member votes once per request.
- **State checks** on every action (campaign status, deadline, amounts against the contract balance).
- **26 Foundry tests:** unit tests, fuzz tests, a reentrancy attacker simulation and access-control tests.
- Funds are never held by Givtru or its operators, only by the campaign contract.

> The contracts have not had a professional third-party audit. Use real funds at your own risk.

---
