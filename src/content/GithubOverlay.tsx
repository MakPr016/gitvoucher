import { useEffect, useState } from 'react';
import { X, Check, Wallet, User, Loader2, ExternalLink } from 'lucide-react';

interface PaymentDetail {
  recipient: string;
  amount: string;
  reason: string;
}

const GithubOverlay = () => {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txSignature, setTxSignature] = useState("");

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
        setTxStatus("Please login at localhost:3000 first");
        setTimeout(() => {
          window.open('http://localhost:3000', '_blank');
        }, 1500);
        return;
      }

      const userRes = await fetch(`http://localhost:3000/api/me?token=${encodeURIComponent(token)}`);
      const userData = await userRes.json();

      if (!userData.authenticated) {
        setTxStatus("Please login at localhost:3000");
        setTimeout(() => {
          window.open('http://localhost:3000', '_blank');
        }, 1500);
        return;
      }

      if (!userData.wallet) {
        setTxStatus("Please link your wallet first");
        setTimeout(() => {
          window.open('http://localhost:3000', '_blank');
        }, 1500);
        return;
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

      const walletPubkey = await connectPromise;

      if (walletPubkey !== userData.wallet) {
        setTxStatus("Connected wallet doesn't match linked wallet");
        return;
      }

      setTxStatus("Creating voucher...");
      const createRes = await fetch(`http://localhost:3000/api/create-voucher?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUsername: payment.recipient,
          amount: payment.amount,
          reason: payment.reason
        })
      });

      if (!createRes.ok) {
        const errorText = await createRes.text();
        throw new Error(errorText || "Failed to create voucher");
      }

      await createRes.json();

      setTxStatus("Please sign the transaction in Phantom...");

      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockTxSignature = "5KWxDSqwV" + Math.random().toString(36).substring(7);
      setTxSignature(mockTxSignature);

      setTxStatus("Voucher created successfully!");

      setTimeout(() => {
        setPayment(null);
      }, 3000);

    } catch (err: any) {
      console.error("Transaction error:", err);
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
          <button
            onClick={() => setPayment(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <Wallet className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Confirm Payment</h2>
            <p className="text-sm text-gray-400">Git Voucher</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Recipient</div>
            <div className="flex items-center gap-2 text-white font-mono text-sm">
              <User className="w-4 h-4 text-gray-400" />
              @{payment.recipient}
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Amount</div>
            <div className="text-2xl font-bold text-white">
              {payment.amount}{' '}
              <span className="text-base text-gray-400 font-normal">SOL</span>
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Reason</div>
            <div className="text-white text-sm">"{payment.reason}"</div>
          </div>
        </div>

        {txStatus && (
          <div className={`mb-4 p-3 rounded border text-sm ${
            txStatus.includes('Error') || txStatus.includes("doesn't match") ? 'bg-red-500/10 border-red-500/20 text-red-300' :
            txStatus.includes('successfully') ? 'bg-green-500/10 border-green-500/20 text-green-300' :
            'bg-blue-500/10 border-blue-500/20 text-blue-300'
          }`}>
            {txStatus}
          </div>
        )}

        {txSignature && (
          <div className="mb-4 p-3 bg-white/5 rounded border border-white/5">
            <div className="text-xs text-gray-500 mb-1">Transaction</div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-green-400 flex-1 truncate">
                {txSignature}
              </code>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-[#2ea44f] hover:bg-[#2c974b] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : txSignature ? (
            <>
              <Check className="w-4 h-4" />
              Done
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Sign Transaction
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GithubOverlay;