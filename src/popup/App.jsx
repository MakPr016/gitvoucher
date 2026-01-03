const App = () => {
    return (
        <div className="w-[320px] h-[400px] p-4 flex flex-col gap-4">
            <h1 className="text-lg font-bold">Git Voucher 🎟️</h1>

            <div className="premium-card">
                <div className="text-gray-400 text-xs uppercase mb-1">Balance</div>
                <div className="text-2xl font-bold">0.00 SOL</div>
            </div>

            <button className="mt-auto w-full bg-white text-black font-medium py-2 rounded-lg hover:bg-gray-200">
                Connect Wallet
            </button>
        </div>
    )
}

export default App

