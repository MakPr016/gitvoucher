import { useEffect, useState } from 'react';
import { Loader2, User, Wallet, ExternalLink, LogIn, GithubIcon } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/me')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-[320px] h-100 flex items-center justify-center bg-background text-white">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="w-[320px] h-100 p-5 flex flex-col gap-5 bg-background text-white">
      <header className="flex items-center gap-2 pb-4 border-b border-white/10">
        <GithubIcon className='h-6 w-6' />
        <h1 className="text-lg font-bold tracking-tight">Git Voucher</h1>
      </header>
      
      {user?.authenticated ? (
        <div className="flex flex-col gap-4">
          <div className="premium-card">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Identity</span>
            </div>
            <div className="font-bold text-white text-lg">{user.username}</div>
            <div className="text-xs text-gray-500 mt-1">ID: {user.githubId || "N/A"}</div>
          </div>

          <div className="premium-card">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Linked Wallet</span>
            </div>
            {user.wallet ? (
              <div className="font-mono text-xs text-green-400 break-all bg-green-900/10 p-2 rounded border border-green-900/20">
                {user.wallet}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-yellow-500">No wallet linked</span>
                <a 
                  href="http://localhost:3000" 
                  target="_blank"
                  className="flex items-center justify-center gap-2 text-xs bg-white text-black py-1.5 rounded font-bold hover:bg-gray-200 transition"
                >
                  Link Now <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
            <LogIn className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="font-bold text-white mb-1">Not Authenticated</p>
            <p className="text-xs text-gray-500 px-4">Log in to the Git Voucher bridge to sync your identity.</p>
          </div>
          <a 
            href="http://localhost:3000" 
            target="_blank"
            className="w-full bg-white text-black py-2.5 rounded-lg font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm"
          >
            Login via GitHub <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  )
}

export default App;
