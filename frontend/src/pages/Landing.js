import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const Landing = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1772050138768-2107c6e62a03?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMGRhcmslMjBkaWdpdGFsJTIwbmV0d29yayUyMGxpbmVzfGVufDB8fHx8MTc3NDEwMzIyM3ww&ixlib=rb-4.1.0&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: theme === 'dark' ? 0.3 : 0.15
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsl(var(--background))] z-0" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none mb-6">
              تداول العملات الرقمية
              <br />
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#06B6D4] to-[#0EA5E9] bg-clip-text text-transparent">بثقة واحترافية</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] mb-8 max-w-2xl mx-auto leading-relaxed">
              منصة NovaDex توفر لك أدوات تداول احترافية، أسعار حية، ومحفظة رقمية آمنة لإدارة استثماراتك في العملات الرقمية
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/register"
                data-testid="get-started-button"
                className="trading-button px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 shadow-lg bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white hover:shadow-2xl hover:scale-105 transition-all"
              >
                ابدأ التداول الآن
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                to="/login"
                data-testid="login-button"
                className="trading-button px-8 py-4 rounded-full font-bold text-lg border-2 border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                تسجيل الدخول
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            <div className="p-8 rounded-2xl border border-[hsl(var(--border))] hover:border-[#3B82F6] transition-all hover:shadow-xl hover:shadow-blue-500/10">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4]">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-4">أسعار حية</h3>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                تتبع أسعار آلاف العملات الرقمية في الوقت الفعلي مع رسوم بيانية تفاعلية وتحديثات لحظية
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[hsl(var(--border))] hover:border-[#3B82F6] transition-all hover:shadow-xl hover:shadow-blue-500/10">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6]">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-4">أمان عالي</h3>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                محفظة رقمية آمنة مع تشفير متقدم لحماية أصولك الرقمية وبياناتك الشخصية
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[hsl(var(--border))] hover:border-[#3B82F6] transition-all hover:shadow-xl hover:shadow-blue-500/10">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-[#06B6D4] to-[#0EA5E9]">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-4">تداول سريع</h3>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                قم بالشراء والبيع الفوري للعملات الرقمية مع واجهة سهلة الاستخدام وتنفيذ سريع للصفقات
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;