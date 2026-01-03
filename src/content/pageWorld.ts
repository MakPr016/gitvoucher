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
});