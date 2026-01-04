# Git Voucher - Chrome Extension

A Chrome/Brave extension that enables GitHub maintainers to send crypto rewards directly from comment boxes. It injects a `/pay` slash command into GitHub's interface and handles transaction signing via Anchor.

## ✨ Features

- **GitHub Injection:** Adds a "Git Voucher" command to the slash-menu in GitHub issues and PRs.
- **Smart Parsing:** Detects `/pay @username amount "reason"` commands in comments.
- **Secure Signing:** Connects to your Solana wallet (Phantom) to sign escrow transactions.
- **Markdown Previews:** Automatically updates comments with a formatted table and claim link after a successful transaction.

## 🛠 Tech Stack

- **Build Tool:** Vite + CRXJS
- **Framework:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Solana:** @coral-xyz/anchor

## 📦 Installation & Development

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd makpr016-gitvoucher
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   ```
   *For development with hot reload, use `npm run dev`.*

4. **Load into Chrome/Brave:**
   1. Open `chrome://extensions/`.
   2. Enable **Developer mode** (top right).
   3. Click **Load unpacked**.
   4. Select the `dist` folder generated in step 3.

## 📖 Usage

1. **Login:** Ensure you are logged into the [Git Voucher Dashboard](http://localhost:3000) and have linked your wallet.
2. **Comment:** Go to any GitHub Issue or PR.
3. **Pay:** Type `/pay` to see the menu, or manually type:
   ```text
   /pay @contributor 0.5 "Great work on this fix!"
   ```
4. **Confirm:** A popup will appear to sign the transaction. Once confirmed, the comment will update with a claim link.
