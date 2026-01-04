import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import idl from '../lib/idl.json';

if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
}

const PROGRAM_ID = new anchor.web3.PublicKey("8iRpzhFJF4PJnhyKZRDXk6B3TKjxQGEX6kcsteYq77iR");

interface PaymentDetail {
  recipient: string;
  amount: string;
  reason: string;
}

const GithubOverlay = () => {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [_txStatus, setTxStatus] = useState("");
  const [_txSignature, setTxSignature] = useState("");

  useEffect(() => {
    const handler = (e: CustomEvent<PaymentDetail>) => {
      setPayment(e.detail);
      setTxStatus("");
      setTxSignature("");
    };
    window.addEventListener('git-voucher-payment', handler as EventListener);
    return () => window.removeEventListener('git-voucher-payment', handler as EventListener);
  }, []);

  const handleConfirm = async () => {
    if (!payment) return;

    setLoading(true);
    setTxStatus("Checking authentication...");

    try {
      const token = await new Promise<string>((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN' }, (response) => {
          resolve(response?.token || '');
        });
      });

      if (!token) {
        throw new Error("Please login at localhost:3000 first");
      }

      const userRes = await fetch(`http://localhost:3000/api/me?token=${encodeURIComponent(token)}`);
      const userData = await userRes.json();

      if (!userData.authenticated || !userData.wallet) {
        throw new Error("Please login and link wallet at localhost:3000");
      }

      setTxStatus("Connecting to Phantom...");

      const connectPromise = new Promise<string>((resolve, reject) => {
        const handler = (event: MessageEvent) => {
          if (event.source !== window) return;
          if (event.data.type === "GIT_VOUCHER_WALLET_CONNECTED") {
            window.removeEventListener("message", handler);
            resolve(event.data.publicKey);
          } else if (event.data.type === "GIT_VOUCHER_WALLET_ERROR") {
            window.removeEventListener("message", handler);
            reject(new Error(event.data.error));
          }
        };
        window.addEventListener("message", handler);
        window.postMessage({ type: "GIT_VOUCHER_CONNECT_WALLET" }, "*");
        setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Wallet connection timed out"));
        }, 15000);
      });

      const walletPubkeyStr = await connectPromise;
      if (walletPubkeyStr !== userData.wallet) {
        throw new Error("Connected wallet doesn't match linked wallet");
      }

      setTxStatus("Preparing transaction...");
      const createRes = await fetch(`http://localhost:3000/api/create-voucher?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUsername: payment.recipient,
          amount: payment.amount,
          reason: payment.reason
        })
      });

      if (!createRes.ok) throw new Error(await createRes.text());
      const voucherData = await createRes.json();

      setTxStatus("Building transaction...");

      const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");

      const provider = new anchor.AnchorProvider(connection, {
        publicKey: new anchor.web3.PublicKey(walletPubkeyStr),
        signTransaction: async () => { throw new Error("Not implemented"); },
        signAllTransactions: async () => { throw new Error("Not implemented"); }
      }, {});

      const program = new anchor.Program(idl as any, provider) as any;

      const orgGithubId = new anchor.BN(voucherData.orgGithubId);
      // Ensure voucher ID is 32 bytes or less for seed
      const seedVoucherId = voucherData.voucherId.length > 32
        ? voucherData.voucherId.replace(/-/g, '').substring(0, 32)
        : voucherData.voucherId;

      const [orgPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("organization"), orgGithubId.toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID
      );

      const [voucherPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("voucher"), Buffer.from(seedVoucherId)],
        PROGRAM_ID
      );

      const amountLamports = new anchor.BN(parseFloat(payment.amount) * 1_000_000_000);
      const recipientId = new anchor.BN(voucherData.recipientGithubId);

      const transaction = new anchor.web3.Transaction();

      // 1. Check & Register User if needed
      const [userProfilePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user-profile"), new anchor.web3.PublicKey(walletPubkeyStr).toBuffer()],
        PROGRAM_ID
      );

      const userProfileAccount = await connection.getAccountInfo(userProfilePDA);
      if (!userProfileAccount && userData.githubId && userData.username) {
        console.log("Adding Register User instruction");
        const registerIx = await program.methods
          .registerUser(new anchor.BN(userData.githubId), userData.username)
          .accounts({
            userProfile: userProfilePDA,
            user: new anchor.web3.PublicKey(walletPubkeyStr),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .instruction();
        transaction.add(registerIx);
      }

      // 1.5 Check & Initialize Organization if needed
      // We use fetchNullable to get the decoded account if it exists
      const orgAccount = await program.account.organizationEscrow.fetchNullable(orgPDA);

      if (!orgAccount) {
        console.log("Adding Initialize Organization instruction");
        const initOrgIx = await program.methods
          .initializeOrganization(orgGithubId)
          .accounts({
            organization: orgPDA,
            admin: new anchor.web3.PublicKey(walletPubkeyStr),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .instruction();
        transaction.add(initOrgIx);

        // If we just initialized, we are definitely not a maintainer yet, so add ourselves
        console.log("Adding Add Maintainer instruction (New Org)");
        const addMaintainerIx = await program.methods
          .addMaintainer(new anchor.web3.PublicKey(walletPubkeyStr))
          .accounts({
            organization: orgPDA,
            admin: new anchor.web3.PublicKey(walletPubkeyStr),
          })
          .instruction();
        transaction.add(addMaintainerIx);

      } else {
        // Org exists, check if we are a maintainer
        const isMaintainer = (orgAccount as any).maintainers.some((m: anchor.web3.PublicKey) =>
          m.toString() === walletPubkeyStr
        );

        if (!isMaintainer) {
          console.log("Adding Add Maintainer instruction (Existing Org)");
          const addMaintainerIx = await program.methods
            .addMaintainer(new anchor.web3.PublicKey(walletPubkeyStr))
            .accounts({
              organization: orgPDA,
              admin: new anchor.web3.PublicKey(walletPubkeyStr),
            })
            .instruction();
          transaction.add(addMaintainerIx);
        }
      }

      // 2. Deposit Funds (Fixes InsufficientBalance)
      const depositIx = await program.methods
        .deposit(amountLamports)
        .accounts({
          organization: orgPDA,
          depositor: new anchor.web3.PublicKey(walletPubkeyStr),
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction();
      transaction.add(depositIx);

      // 3. Create Voucher
      const createVoucherIx = await program.methods
        .createVoucher(
          seedVoucherId,
          recipientId,
          amountLamports,
          JSON.stringify({ reason: payment.reason })
        )
        .accounts({
          organization: orgPDA,
          voucher: voucherPDA,
          maintainer: new anchor.web3.PublicKey(walletPubkeyStr),
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction();

      transaction.add(createVoucherIx);

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = new anchor.web3.PublicKey(walletPubkeyStr);

      setTxStatus("Please sign in Phantom...");

      const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

      const signPromise = new Promise<string>((resolve, reject) => {
        const handler = (event: MessageEvent) => {
          if (event.source !== window) return;
          if (event.data.type === "GIT_VOUCHER_TX_SIGNED") {
            window.removeEventListener("message", handler);
            resolve(event.data.signedTransaction); // Changed to expect full tx
          } else if (event.data.type === "GIT_VOUCHER_WALLET_ERROR") {
            window.removeEventListener("message", handler);
            reject(new Error(event.data.error));
          }
        };
        window.addEventListener("message", handler);
        window.postMessage({
          type: "GIT_VOUCHER_SIGN_AND_SEND", // Keep type name or change to SIGN_ONLY if you prefer, but logic changes result
          transaction: serializedTx
        }, "*");
      });

      const signedTxBase64 = await signPromise;
      setTxStatus("Sending transaction...");

      // Deserialize the signed transaction
      const signedTx = anchor.web3.Transaction.from(Buffer.from(signedTxBase64, 'base64'));

      const signature = await connection.sendRawTransaction(signedTx.serialize());
      setTxSignature(signature);

      setTxStatus("Confirming transaction...");

      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      });

      setTxStatus("Success! Voucher on-chain.");

      window.dispatchEvent(new CustomEvent('git-voucher-payment-success', {
        detail: {
          voucherId: seedVoucherId, // Use the sanitized ID
          amount: payment.amount,
          recipient: payment.recipient,
          signature: signature
        }
      }));

      setTimeout(() => setPayment(null), 3000);

    } catch (err: any) {
      console.error("Tx Error:", err);
      setTxStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <div className="fixed inset-0 z-2147483647 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1c1c1c] border border-white/10 rounded-xl w-105 p-6 shadow-2xl relative">
        {!loading && (
          <button onClick={() => setPayment(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-2">Confirm Payment</h2>
          <p className="text-sm text-gray-400">Git Voucher</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Recipient Username/ID</label>
            <div className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg p-3 text-white text-sm">
              {payment.recipient}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</label>
            <div className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg p-3 text-white text-sm">
              {payment.amount} SOL
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Message</label>
            <div className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg p-3 text-white text-sm">
              {payment.reason}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
            onClick={() => setPayment(null)}
          >
            Reset
          </button>
          <button
            className="bg-[#2ea44f] hover:bg-[#2c974b] text-white font-bold py-2 px-4 rounded-lg"
            onClick={handleConfirm}
            disabled={loading}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default GithubOverlay;
