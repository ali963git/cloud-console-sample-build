import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(email, password, fullName);
    
    if (result.success) {
      toast.success('تم إنشاء الحساب بنجاح!');
      navigate('/dashboard');
    } else {
      setError(result.error);
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-black mb-2">
            <span className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent">Cryptix</span>
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">إنشاء حساب جديد</p>
        </div>

        <div className="glass-effect rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20" data-testid="error-message">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-500">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                الاسم الكامل
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20 transition-colors"
                  placeholder="أدخل اسمك الكامل"
                  required
                  data-testid="fullname-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20 transition-colors"
                  placeholder="البريد الإلكتروني"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20 transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  data-testid="password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-lg trading-button disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              data-testid="register-submit-button"
            >
              {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="font-bold hover:underline text-[#3B82F6]" data-testid="login-link">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;