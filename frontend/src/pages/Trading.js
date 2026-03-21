import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cryptoApi } from '../services/api';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const Trading = () => {
  const [searchParams] = useSearchParams();
  const initialCoin = searchParams.get('coin') || 'bitcoin';
  
  const [selectedCoin, setSelectedCoin] = useState(initialCoin);
  const [coinPrice, setCoinPrice] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchCoinPrice();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedCoin]);

  const fetchData = async () => {
    try {
      const [priceData, chartDataRes, walletData] = await Promise.all([
        cryptoApi.getSinglePrice(selectedCoin),
        cryptoApi.getChartData(selectedCoin, 7),
        cryptoApi.getWallet()
      ]);
      
      setCoinPrice(priceData);
      setWallet(walletData);
      
      const formattedChart = chartDataRes.prices.map(([timestamp, price]) => ({
        time: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: price
      }));
      setChartData(formattedChart);
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
      console.error(error);
    }
  };

  const fetchCoinPrice = async () => {
    try {
      const priceData = await cryptoApi.getSinglePrice(selectedCoin);
      setCoinPrice(priceData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('الرجاء إدخال كمية صحيحة');
      return;
    }

    setLoading(true);

    try {
      const symbol = selectedCoin.toUpperCase();
      const numAmount = parseFloat(amount);
      const price = coinPrice.price_usd;

      if (tradeType === 'buy') {
        await cryptoApi.buyTrading(symbol, numAmount, price);
        toast.success(`تم شراء ${numAmount} ${symbol} بنجاح!`);
      } else {
        await cryptoApi.sellTrading(symbol, numAmount, price);
        toast.success(`تم بيع ${numAmount} ${symbol} بنجاح!`);
      }

      setAmount('');
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشلت العملية');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!amount || !coinPrice) return 0;
    return parseFloat(amount) * coinPrice.price_usd;
  };

  const getAvailableBalance = () => {
    if (!wallet) return 0;
    if (tradeType === 'buy') {
      return wallet.balances.USD || 0;
    } else {
      return wallet.balances[selectedCoin.toUpperCase()] || 0;
    }
  };

  return (
    <div className="min-h-screen" data-testid="trading-page">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold mb-6">منصة التداول</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Info */}
            {coinPrice && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-heading text-2xl font-bold capitalize">{selectedCoin}</h2>
                    <p className="font-mono text-4xl font-bold mt-2" data-testid="current-price">
                      ${coinPrice.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 text-2xl font-mono font-bold ${
                    coinPrice.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {coinPrice.price_change_24h >= 0 ? (
                      <TrendingUp className="w-6 h-6" />
                    ) : (
                      <TrendingDown className="w-6 h-6" />
                    )}
                    {Math.abs(coinPrice.price_change_24h).toFixed(2)}%
                  </div>
                </div>
              </motion.div>
            )}

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-effect rounded-xl p-6"
            >
              <h3 className="font-bold mb-4">الرسم البياني (7 أيام)</h3>
              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#F7931A" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Trading Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="glass-effect rounded-xl p-6 sticky top-6">
              <h3 className="font-heading text-xl font-bold mb-6">تنفيذ الصفقة</h3>

              {/* Trade Type Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                    tradeType === 'buy'
                      ? 'text-white'
                      : 'bg-transparent border-2 border-[hsl(var(--border))]'
                  }`}
                  style={tradeType === 'buy' ? { backgroundColor: '#10B981' } : {}}
                  data-testid="buy-tab"
                >
                  شراء
                </button>
                <button
                  onClick={() => setTradeType('sell')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                    tradeType === 'sell'
                      ? 'text-white'
                      : 'bg-transparent border-2 border-[hsl(var(--border))]'
                  }`}
                  style={tradeType === 'sell' ? { backgroundColor: '#EF4444' } : {}}
                  data-testid="sell-tab"
                >
                  بيع
                </button>
              </div>

              <form onSubmit={handleTrade} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                    الكمية
                  </label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20 transition-colors font-mono"
                    placeholder="0.00"
                    required
                    data-testid="amount-input"
                  />
                  <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    الرصيد المتاح: <span className="font-mono font-bold">{getAvailableBalance().toFixed(8)}</span>
                  </div>
                </div>

                {coinPrice && (
                  <div className="p-4 rounded-lg bg-[hsl(var(--muted))]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">السعر:</span>
                      <span className="font-mono font-bold" data-testid="trade-price">${coinPrice.price_usd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">الإجمالي:</span>
                      <span className="font-mono font-bold text-lg" data-testid="trade-total">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-bold text-lg trading-button disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  style={{ backgroundColor: tradeType === 'buy' ? '#10B981' : '#EF4444' }}
                  data-testid="execute-trade-button"
                >
                  {loading ? 'جاري التنفيذ...' : (tradeType === 'buy' ? 'شراء' : 'بيع')}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Trading;