// src/components/common/AmountCard.jsx
import React, { useEffect, useState } from "react";
import config from "../../config";

export default function AmountCard({ distributorId, myWallet = false, tokenKey = "staffToken" }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem(tokenKey); // tokenKey -> can be "staffToken" or "distributorToken"

  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!distributorId && !myWallet) return;

      const url = myWallet
        ? `${config.API_BASE}/wallets/me`
        : `${config.API_BASE}/wallets/${distributorId}`;

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && typeof data.walletBalance === "number") {
          setBalance(data.walletBalance);
        } else {
          setBalance(0);
        }
      } catch (err) {
        console.error("Failed to fetch wallet balance:", err);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletBalance();
  }, [distributorId, myWallet, token]);

  return (
    <div className="mx-3 mx-md-auto my-3 bg-white rounded-4 p-4 shadow border border-2 border-light position-relative overflow-hidden w-100" style={{ maxWidth: '800px' }}>
      {/* Top accent border */}
      <div className="position-absolute top-0 start-0 end-0 bg-info border-info border-top border-3 rounded-top"></div>
      
      <div className="text-muted fw-semibold text-uppercase mb-3 text-center position-relative fs-6">
        <span>Amount due by dealer SVD Dairy Products</span>
      </div>
      
      <div className={`fw-bold text-center position-relative display-6 ${loading ? 'text-muted fst-italic' : 'text-dark'}`}>
        {loading ? (
          <>
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            Loading...
          </>
        ) : (
          <>
            <span className="text-dark">₹ {balance.toFixed(2)}</span>
            <div className="position-absolute bg-info rounded mt-1 border-info border-2"></div>
          </>
        )}
      </div>
    </div>
  );
}
