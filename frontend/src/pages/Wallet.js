import React, { useState, useEffect } from 'react';
import { cryptoApi } from '../services/api';
import { Wallet as WalletIcon, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletData, txData, pricesData] = await Promise.all([
        cryptoApi.getWallet(),
        cryptoApi.getTransactions(20),
        cryptoApi.getPrices(50)
      ]);
      setWallet(walletData);
      setTransactions(txData);
      setPrices(pricesData);
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getCoinPrice = (symbol) => {
    const coin = prices.find(p => p.symbol === symbol);
    return coin ? coin.current_price : 0;
  };

  const calculateAssetValue = (symbol, amount) => {
    if (symbol === 'USD') return amount;
    return amount * getCoinPrice(symbol);
  };

  const getTotalPortfolioValue = () => {
    if (!wallet) return 0;
    let total = 0;
    Object.entries(wallet.balances).forEach(([symbol, amount]) => {
      total += calculateAssetValue(symbol, amount);
    });
    return total;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[hsl(var(--muted-foreground))]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="wallet-page">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold mb-6">المحفظة</h1>

        {/* Portfolio Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-8 mb-8 border border-[hsl(var(--border))] hover:border-[#3B82F6] transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] shadow-lg shadow-blue-500/30">
              <WalletIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">إجمالي قيمة المحفظة</p>
              <h2 className="font-mono text-4xl font-black" data-testid="total-portfolio-value">
                ${getTotalPortfolioValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Assets */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-heading text-xl font-bold mb-4">الأصول</h2>
            <div className="space-y-3" data-testid="assets-list">
              {wallet && Object.entries(wallet.balances).map(([symbol, amount]) => {
                if (amount === 0) return null;
                const value = calculateAssetValue(symbol, amount);
                const percentage = (value / getTotalPortfolioValue()) * 100;

                return (
                  <div
                    key={symbol}
                    className="glass-effect rounded-xl p-4 hover:border-[#3B82F6] border border-[hsl(var(--border))] transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
                    data-testid={`asset-${symbol}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{symbol}</h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] font-mono">
                          {amount.toFixed(8)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold" data-testid={`asset-value-${symbol}`}>
                          ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {percentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-heading text-xl font-bold mb-4">آخر المعاملات</h2>
            <div className="space-y-3" data-testid="transactions-list">
              {transactions.length === 0 ? (
                <div className="glass-effect rounded-xl p-8 text-center">
                  <p className="text-[hsl(var(--muted-foreground))]">لا توجد معاملات بعد</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="glass-effect rounded-xl p-4 border border-[hsl(var(--border))] hover:border-[#3B82F6] transition-all hover:shadow-lg hover:shadow-blue-500/10"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          <TrendingUp 
                            className={`w-5 h-5 ${
                              tx.type === 'buy' ? 'text-green-500' : 'text-red-500 rotate-180'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-bold">
                            {tx.type === 'buy' ? 'شراء' : 'بيع'} {tx.crypto_symbol}
                          </p>
                          <p className="text-sm text-[hsl(var(--muted-foreground))] font-mono">
                            {tx.amount.toFixed(8)} {tx.crypto_symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold ${
                          tx.type === 'buy' ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {tx.type === 'buy' ? '-' : '+'}${tx.total_usd.toFixed(2)}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          @${tx.price_usd.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] mt-2">
                      <Clock className="w-3 h-3" />
                      {new Date(tx.timestamp).toLocaleString('ar-SA', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
