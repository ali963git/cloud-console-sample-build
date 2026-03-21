import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Activity, DollarSign } from 'lucide-react';
import { cryptoApi } from '../services/api';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Dashboard = () => {
  const [prices, setPrices] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [pricesData, walletData] = await Promise.all([
        cryptoApi.getPrices(10),
        cryptoApi.getWallet()
      ]);
      setPrices(pricesData);
      setWallet(walletData);
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioValue = () => {
    if (!wallet) return 0;
    let total = wallet.balances.USD || 0;
    
    Object.entries(wallet.balances).forEach(([symbol, amount]) => {
      if (symbol !== 'USD') {
        const coin = prices.find(p => p.symbol === symbol);
        if (coin) {
          total += amount * coin.current_price;
        }
      }
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

  const portfolioValue = calculatePortfolioValue();

  return (
    <div className="min-h-screen" data-testid="dashboard-page">
      <div className="container mx-auto px-4 py-8">
        {/* Portfolio Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-3xl font-bold mb-6">لوحة التحكم</h1>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl border border-[hsl(var(--border))] glass-effect" data-testid="portfolio-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  قيمة المحفظة
                </span>
                <Wallet className="w-5 h-5 text-[hsl(var(--primary))]" />
              </div>
              <p className="font-mono text-3xl font-bold" data-testid="portfolio-value">
                ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[hsl(var(--border))] glass-effect">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  رصيد USD
                </span>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <p className="font-mono text-3xl font-bold" data-testid="usd-balance">
                ${(wallet?.balances?.USD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[hsl(var(--border))] glass-effect">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  الأصول
                </span>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <p className="font-mono text-3xl font-bold">
                {wallet ? Object.keys(wallet.balances).length : 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Market Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-heading text-2xl font-bold mb-4">نظرة على السوق</h2>
          
          <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden" data-testid="market-table">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[hsl(var(--muted))]">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                      العملة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                      السعر
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                      التغيير 24س
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                      القيمة السوقية
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                      الحجم 24س
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {prices.map((coin, index) => (
                    <tr 
                      key={coin.coin_id} 
                      className="hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer"
                      data-testid={`coin-row-${coin.symbol}`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold">{coin.name}</div>
                          <div className="text-sm text-[hsl(var(--muted-foreground))]">{coin.symbol}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold" data-testid={`price-${coin.symbol}`}>
                        ${coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1 font-mono font-semibold ${
                          coin.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {coin.price_change_24h >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {Math.abs(coin.price_change_24h).toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        ${(coin.market_cap / 1e9).toFixed(2)}B
                      </td>
                      <td className="px-6 py-4 font-mono">
                        ${(coin.volume_24h / 1e9).toFixed(2)}B
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
