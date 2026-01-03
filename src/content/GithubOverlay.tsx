import { useEffect, useState } from 'react';
import { X, Check, Wallet, User } from 'lucide-react';

const GithubOverlay = () => {
  const [payment, setPayment] = useState<{ recipient: string; amount: string; reason: string } | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      console.log('[GithubOverlay] Payment event received:', e.detail);
      setPayment(e.detail);
    };
    window.addEventListener('git-voucher-payment', handler);
    return () => window.removeEventListener('git-voucher-payment', handler);
  }, []);

  if (!payment) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1c1c1c] border border-white/10 rounded-xl w-[400px] p-6 shadow-2xl relative">
        <button 
          onClick={() => setPayment(null)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <Wallet className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Confirm Payment</h2>
            <p className="text-sm text-gray-400">Git Voucher</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Recipient</div>
            <div className="flex items-center gap-2 text-white font-mono">
              <User className="w-4 h-4 text-gray-400" />
              @{payment.recipient}
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Amount</div>
            <div className="text-2xl font-bold text-white">{payment.amount} <span className="text-sm text-gray-400 font-normal">USDC</span></div>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">For</div>
            <div className="text-white italic">"{payment.reason}"</div>
          </div>
        </div>

        <button 
          className="w-full bg-[#2ea44f] hover:bg-[#2c974b] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          onClick={() => alert('Transaction Signed! (Mock)')}
        >
          <Check className="w-4 h-4" />
          Sign Transaction
        </button>
      </div>
    </div>
  );
};

export default GithubOverlay;
