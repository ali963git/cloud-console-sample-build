import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cryptoApi } from '../services/api';
import { CreditCard, Building2, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Deposit = () => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const paymentMethods = [
    {
      id: 'card',
      name: 'بطاقة ائتمان أو خصم',
      icon: CreditCard,
      description: 'فيزا، ماستركارد، أمريكان إكسبريس',
      gradient: 'from-[#3B82F6] to-[#06B6D4]'
    },
    {
      id: 'bank_transfer',
      name: 'تحويل بنكي',
      icon: Building2,
      description: 'تحويل مباشر من حسابك البنكي',
      gradient: 'from-[#8B5CF6] to-[#6366F1]'
    },
    {
      id: 'crypto',
      name: 'عملة رقمية',
      icon: Smartphone,
      description: 'تيثر، يو إس دي سي، بيتكوين، إيثريوم',
      gradient: 'from-[#06B6D4] to-[#0EA5E9]'
    }
  ];

  const quickAmounts = [100, 500, 1000, 5000, 10000];

  const handleDeposit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }

    setLoading(true);

    try {
      await cryptoApi.depositFunds(parseFloat(amount), paymentMethod);
      setStep(2);
      toast.success('تم إيداع الأموال بنجاح!');
      
      setTimeout(() => {
        navigate('/wallet');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشلت عملية الإيداع');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="font-heading text-3xl font-bold mb-3">تم الإيداع بنجاح!</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            تم إضافة ${parseFloat(amount).toLocaleString()} إلى محفظتك
          </p>
          <button
            onClick={() => navigate('/wallet')}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white font-bold hover:shadow-lg transition-all"
          >
            عودة إلى المحفظة
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="deposit-page">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-heading text-3xl font-bold mb-2">إيداع الأموال</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-8">
            أضف أموال إلى محفظتك لبدء التداول
          </p>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Payment Methods */}
            <div>
              <h2 className="font-bold text-xl mb-4">اختر طريقة الدفع</h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <motion.button
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
                        paymentMethod === method.id
                          ? 'border-[#3B82F6] bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 shadow-lg shadow-blue-500/20'
                          : 'border-[hsl(var(--border))] hover:border-[#3B82F6]/50'
                      }`}
                      data-testid={`payment-method-${method.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${method.gradient} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{method.name}</h3>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            {method.description}
                          </p>
                        </div>
                        {paymentMethod === method.id && (
                          <CheckCircle2 className="w-6 h-6 text-[#3B82F6]" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Amount Form */}
            <div>
              <h2 className="font-bold text-xl mb-4">أدخل المبلغ</h2>
              
              <form onSubmit={handleDeposit} className="space-y-6">
                <div className="glass-effect rounded-xl p-6 border border-[hsl(var(--border))]">
                  <label className="block text-sm font-bold uppercase tracking-wider mb-3">
                    المبلغ (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[hsl(var(--muted-foreground))]">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pr-12 pl-4 py-4 text-3xl font-bold font-mono rounded-lg bg-[hsl(var(--background))] border-2 border-[hsl(var(--border))] focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 transition-all"
                      placeholder="0.00"
                      required
                      data-testid="amount-input"
                    />
                  </div>

                  {/* Quick amounts */}
                  <div className="mt-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                      مبالغ سريعة:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quickAmounts.map((quickAmount) => (
                        <button
                          key={quickAmount}
                          type="button"
                          onClick={() => setAmount(quickAmount.toString())}
                          className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] hover:border-[#3B82F6] hover:bg-[#3B82F6]/10 transition-all font-mono font-bold"
                          data-testid={`quick-amount-${quickAmount}`}
                        >
                          ${quickAmount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {amount && parseFloat(amount) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-effect rounded-xl p-6 border border-[hsl(var(--border))] bg-gradient-to-br from-[#3B82F6]/5 to-[#06B6D4]/5"
                  >
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-[hsl(var(--muted-foreground))]">المبلغ</span>
                      <span className="font-mono font-bold text-lg">${parseFloat(amount).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[hsl(var(--muted-foreground))]">رسوم المعالجة</span>
                      <span className="font-mono font-bold text-green-500">مجاناً</span>
                    </div>
                    <div className="h-px bg-[hsl(var(--border))] my-3" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold">الإجمالي</span>
                      <span className="font-mono font-bold text-2xl text-[#3B82F6]">
                        ${parseFloat(amount).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading || !amount || parseFloat(amount) <= 0}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="submit-deposit-button"
                >
                  {loading ? 'جاري المعالجة...' : 'تأكيد الإيداع'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Deposit;
