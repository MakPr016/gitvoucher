import { Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
}

window.addEventListener("message", async (event) => {
  if (event.source !== window) return;

  if (event.data.type === "GIT_VOUCHER_CONNECT_WALLET") {
    if ((window as any).solana?.isPhantom) {
      try {
        const resp = await (window as any).solana.connect();
        window.postMessage({
          type: "GIT_VOUCHER_WALLET_CONNECTED",
          publicKey: resp.publicKey.toString()
        }, "*");
      } catch (err: any) {
        window.postMessage({ type: "GIT_VOUCHER_WALLET_ERROR", error: err.message }, "*");
      }
    } else {
      window.postMessage({ type: "GIT_VOUCHER_WALLET_ERROR", error: "Phantom not installed" }, "*");
    }
  }

  if (event.data.type === "GIT_VOUCHER_SIGN_AND_SEND") {
    try {
      const provider = (window as any).solana;
      if (!provider) throw new Error("Wallet not found");

      const txBuffer = Buffer.from(event.data.transaction, 'base64');
      const transaction = Transaction.from(txBuffer);

      const signedTx = await provider.signTransaction(transaction);

      const serialized = signedTx.serialize().toString('base64');

      window.postMessage({
        type: "GIT_VOUCHER_TX_SIGNED",
        signedTransaction: serialized
      }, "*");

    } catch (err: any) {
      window.postMessage({ type: "GIT_VOUCHER_WALLET_ERROR", error: err.message }, "*");
    }
  }
});
