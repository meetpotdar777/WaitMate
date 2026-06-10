/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { Plus, Bell, RefreshCw, AlertCircle, CheckCircle, TrendingDown, TrendingUp, Search, Filter, X, Zap, ChevronRight, Moon, Sun, ArrowUpDown, Download, DollarSign } from 'lucide-react';
import { Tracker, Currency } from './types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹'
};

export default function App() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [newTrackerUrl, setNewTrackerUrl] = useState('');
  const [newTrackerTarget, setNewTrackerTarget] = useState('');
  const [newTrackerCategory, setNewTrackerCategory] = useState<Tracker['category']>('product');
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);

  const savingsGoal = 500;
  const currentSavings = 240;

  useEffect(() => {
    // Mock fetching trackers
    setTrackers([
      {
        id: '1', url: 'https://example.com/flight/1', name: 'NYC to LDN Flight',
        currentPrice: 500, targetPrice: 400, lastChecked: '10 mins ago', status: 'monitoring',
        priceHistory: [{ date: 'Jan', price: 600 }, { date: 'Feb', price: 550 }, { date: 'Mar', price: 500 }],
        recommendation: 'wait', category: 'flight', insight: 'Price trend is downward, save $100 more by waiting.',
        createdAt: new Date().toISOString()
      },
      {
        id: '2', url: 'https://example.com/phone/1', name: 'Latest Smartphone',
        currentPrice: 850, targetPrice: 850, lastChecked: '2 hours ago', status: 'price-dropped',
        priceHistory: [{ date: 'Jan', price: 950 }, { date: 'Feb', price: 900 }, { date: 'Mar', price: 850 }],
        recommendation: 'buy', category: 'product', insight: 'Historical low detected. Prime time to purchase.',
        createdAt: new Date().toISOString()
      },
      {
        id: '3', url: 'https://example.com/tickets/1', name: 'Summer Festival',
        currentPrice: 200, targetPrice: 150, lastChecked: 'Just now', status: 'available',
        priceHistory: [{ date: 'Feb', price: 200 }, { date: 'Mar', price: 200 }],
        recommendation: 'buy', category: 'event', insight: 'Tickets are selling fast, price unlikely to drop further.',
        createdAt: new Date().toISOString()
      },
    ]);
  }, []);

  const handleAddTracker = () => {
    if (!newTrackerUrl) return;

    const newTracker: Tracker = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTrackerUrl.split('/').pop()?.split('?')[0].replace(/-/g, ' ').replace(/_/g, ' ') || 'New Tracker',
      url: newTrackerUrl,
      currentPrice: Math.floor(Math.random() * 500) + 100,
      targetPrice: Number(newTrackerTarget) || undefined,
      status: 'monitoring',
      lastChecked: 'Just now',
      recommendation: 'unknown',
      category: newTrackerCategory,
      createdAt: new Date().toISOString(),
      priceHistory: [
        { date: '1d', price: 400 + (Math.random() * 50) },
        { date: 'Now', price: 400 }
      ]
    };

    setTrackers([newTracker, ...trackers]);
    setNewTrackerUrl('');
    setNewTrackerTarget('');
    setIsAddModalOpen(false);
  };

  const exportData = () => {
    const data = trackers.map(t => `${t.name},${t.currentPrice},${t.status}`).join('\n');
    const blob = new Blob([`Name,Price,Status\n${data}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waitmate-trackers.csv';
    a.click();
  };

  const handleDelete = (id: string) => {
    setTrackers(trackers.filter(t => t.id !== id));
  };

  const getAiInsight = async (tracker: Tracker) => {
    setIsAiLoading(tracker.id);
    try {
      const response = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tracker.name,
          currentPrice: tracker.currentPrice,
          history: tracker.priceHistory
        })
      });
      const data = await response.json();
      
      const [recPart, reasonPart] = data.result.split('|');
      const rec = recPart?.includes('BUY') ? 'buy' : 'wait';
      const reason = reasonPart ? reasonPart.replace('REASON:', '').trim() : 'AI suggests staying alert.';

      setTrackers(tks => tks.map(t => t.id === tracker.id ? {
        ...t,
        recommendation: rec as any,
        insight: reason
      } : t));
    } catch (err) {
      console.error('AI Insight Error:', err);
    } finally {
      setIsAiLoading(null);
    }
  };

  const simulateUpdate = (id: string) => {
    setTrackers(trackers.map(t => {
      if (t.id === id) {
        const newPrice = Math.max(50, t.currentPrice + (Math.random() > 0.5 ? -20 : 20));
        const status: Tracker['status'] = (t.targetPrice && newPrice <= t.targetPrice) ? 'price-dropped' : 'monitoring';
        return {
          ...t,
          currentPrice: newPrice,
          status,
          lastChecked: 'Just now',
          priceHistory: [...t.priceHistory.slice(-9), { date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), price: newPrice }]
        };
      }
      return t;
    }));
  };

  const filteredTrackers = useMemo(() => {
    let result = trackers.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.url.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || t.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.currentPrice - b.currentPrice);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.currentPrice - a.currentPrice);
    } // newest is default as we prepend to the array

    return result;
  }, [trackers, searchQuery, filterStatus, sortBy]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'}`}>
      <header className="mx-auto max-w-6xl p-4 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-indigo-500 flex items-center gap-2">
            <Zap className="fill-indigo-500" />
            WaitMate
          </h1>
          <p className={`${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'} font-medium`}>Smart price & availability sentinel</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 p-1 rounded-xl shadow-inner ${isDarkMode ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-100 border border-neutral-200'}`}>
            {(['USD', 'EUR', 'GBP', 'INR'] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${currency === c ? 'bg-indigo-500 text-white shadow-md' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-neutral-900 text-yellow-400 hover:bg-neutral-800' : 'bg-white text-neutral-400 hover:text-neutral-600 border border-neutral-200 shadow-sm'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className={`p-2 transition-colors ${isDarkMode ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <Bell size={24} />
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            New Tracker
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-8">
        <section className="mb-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active Trackers" value={trackers.length} icon={<RefreshCw className="text-blue-500" />} isDarkMode={isDarkMode} />
          <StatCard label="Price Alerts" value={trackers.filter(t => t.status === 'price-dropped').length} icon={<TrendingDown className="text-amber-500" />} isDarkMode={isDarkMode} />
          <StatCard label="Restocks" value={trackers.filter(t => t.status === 'available').length} icon={<CheckCircle className="text-green-500" />} isDarkMode={isDarkMode} />
          <StatCard label="Total Savings" value={`${CURRENCY_SYMBOLS[currency]}${currentSavings}`} icon={<Zap className="text-indigo-500" />} isDarkMode={isDarkMode} />
        </section>

        <div className={`mb-8 flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Search your trackers..."
              className={`w-full pl-10 pr-4 py-2 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isDarkMode ? 'bg-neutral-800 text-white placeholder:text-neutral-600' : 'bg-neutral-50 text-neutral-900'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full">
              <Filter size={18} className="text-neutral-400 shrink-0" />
              <select 
                className={`border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium ${isDarkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-50'}`}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="monitoring">Monitoring</option>
                <option value="price-dropped">Price Drops</option>
                <option value="available">Available</option>
              </select>
            </div>
            <div className="flex items-center gap-2 w-full">
              <ArrowUpDown size={18} className="text-neutral-400 shrink-0" />
              <select 
                className={`border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium ${isDarkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-50'}`}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 flex flex-col gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTrackers.map((tracker) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={tracker.id} 
                  className={`group relative rounded-3xl border transition-all p-6 shadow-sm hover:shadow-lg ${isDarkMode ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-neutral-300'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-2xl h-12 w-12 flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                        {CATEGORY_ICONS[tracker.category]}
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold group-hover:text-indigo-500 transition-colors ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{tracker.name}</h2>
                        <a href={tracker.url} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-500 flex items-center gap-1 font-medium hover:text-indigo-500 transition-colors">
                          {tracker.url.split('/')[2]} <ChevronRight size={12} />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <StatusBadge status={tracker.status} />
                       <button 
                        onClick={() => handleDelete(tracker.id)}
                        className={`p-1.5 transition-colors rounded-lg ${isDarkMode ? 'text-neutral-600 hover:text-rose-500 bg-neutral-800' : 'text-neutral-300 hover:text-rose-500 bg-neutral-50'}`}
                       >
                         <X size={14} />
                       </button>
                    </div>
                  </div>
                  
                  <div className={`flex flex-wrap items-center justify-between gap-6 border-t pt-6 ${isDarkMode ? 'border-neutral-800' : 'border-neutral-100'}`}>
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-1">Current</p>
                        <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{CURRENCY_SYMBOLS[currency]}{tracker.currentPrice}</p>
                      </div>
                      {tracker.targetPrice && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-1">Target</p>
                          <p className="text-3xl font-black text-indigo-500">{CURRENCY_SYMBOLS[currency]}{tracker.targetPrice}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => simulateUpdate(tracker.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700' : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100'}`}
                      >
                        Simulate Pulse
                      </button>
                      <button 
                        onClick={() => getAiInsight(tracker)}
                        disabled={isAiLoading === tracker.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors disabled:opacity-50 ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        {isAiLoading === tracker.id ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} className="fill-indigo-500" />}
                        {tracker.recommendation === 'unknown' ? 'AI Analysis' : 'Refresh Insight'}
                      </button>
                      <RecommendationBadge recommendation={tracker.recommendation} />
                    </div>
                  </div>

                  {tracker.insight && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`mt-6 p-4 rounded-2xl border flex gap-3 text-sm italic ${isDarkMode ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}
                    >
                      <Zap size={18} className="shrink-0 animate-pulse fill-indigo-200" />
                      {tracker.insight}
                    </motion.div>
                  )}

                  <div className="mt-8 h-48 w-full transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={tracker.priceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`colorPrice-${tracker.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#262626" : "#f0f0f0"} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#737373', fontWeight: 600 }}
                          dy={10}
                        />
                        <YAxis 
                          hide={false}
                          orientation="right"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#737373', fontWeight: 600 }}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '8px 12px',
                            backgroundColor: isDarkMode ? '#171717' : '#ffffff',
                            color: isDarkMode ? '#ffffff' : '#171717'
                          }}
                          itemStyle={{ color: '#6366f1' }}
                          cursor={{ stroke: isDarkMode ? '#404040' : '#e2e8f0', strokeWidth: 2 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#6366f1" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill={`url(#colorPrice-${tracker.id})`}
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredTrackers.length === 0 && (
              <div className={`text-center py-20 rounded-3xl border-2 border-dashed ${isDarkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-600' : 'bg-neutral-100 border-neutral-300 text-neutral-400'}`}>
                <p className="font-bold text-lg">No sentinels found matching your criteria.</p>
              </div>
            )}
          </section>

          <aside className="lg:col-span-4 flex flex-col gap-8">
            <section className={`rounded-3xl border p-6 transition-colors shadow-sm ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
              <h3 className={`text-xl font-black mb-6 flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={24} className="text-indigo-600" />
                  Live Pulse
                </div>
                <button onClick={exportData} title="Export Data" className="text-neutral-400 hover:text-indigo-500 transition-colors">
                  <Download size={20} />
                </button>
              </h3>
              <div className="space-y-6 text-sm">
                <ActivityItem 
                  icon={<TrendingDown className="text-amber-600" />}
                  bg="bg-amber-100/10"
                  title="Price Drop"
                  desc="Smartphone dropped below $900"
                  time="2m ago"
                  isDarkMode={isDarkMode}
                />
                <ActivityItem 
                  icon={<Bell className="text-indigo-600" />}
                  bg="bg-indigo-100/10"
                  title="Sync Complete"
                  desc="Checked 12 sources"
                  time="15m ago"
                  isDarkMode={isDarkMode}
                />
              </div>
            </section>

            <section className={`rounded-3xl border p-6 transition-colors shadow-sm ${isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200'}`}>
              <h4 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-green-500" />
                Savings Goal
              </h4>
              <div className="mb-4">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-neutral-500">Progress</span>
                  <span className="text-indigo-500 font-black">{Math.round((currentSavings/savingsGoal) * 100)}%</span>
                </div>
                <div className={`h-4 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentSavings/savingsGoal) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">
                {CURRENCY_SYMBOLS[currency]}{currentSavings} saved out of {CURRENCY_SYMBOLS[currency]}{savingsGoal} goal
              </p>
            </section>

            <section className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-2xl font-black mb-2">WaitMate Pro</h4>
                <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Unlock unlimited trackers and high-frequency monitoring for the best deals.</p>
                <button className="w-full py-3 bg-white text-indigo-600 font-black rounded-xl hover:bg-indigo-50 transition-colors">
                  Upgrade Now
                </button>
              </div>
              <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500 opacity-20 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
            </section>
          </aside>
        </div>
      </main>

      {/* Add Tracker Modal Mock */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-600"
              >
                <X size={24} />
              </button>
              <h2 className="text-3xl font-black mb-2">Add New Sentinel</h2>
              <p className="text-neutral-500 mb-8 font-medium">Specify what we should watch for you.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-neutral-400 uppercase tracking-widest mb-2">Monitor Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['product', 'flight', 'hotel', 'event'] as Tracker['category'][]).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setNewTrackerCategory(cat)}
                        className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${newTrackerCategory === cat ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-neutral-50 text-neutral-400 hover:text-neutral-600'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-neutral-400 uppercase tracking-widest mb-2">URL or Keyword</label>
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    value={newTrackerUrl}
                    onChange={(e) => setNewTrackerUrl(e.target.value)}
                    className="w-full p-4 bg-neutral-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-600 outline-none font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-neutral-400 uppercase tracking-widest mb-2">Target Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">{CURRENCY_SYMBOLS[currency]}</span>
                    <input 
                      type="number" 
                      placeholder="499" 
                      value={newTrackerTarget}
                      onChange={(e) => setNewTrackerTarget(e.target.value)}
                      className="w-full p-4 pl-10 bg-neutral-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-600 outline-none font-medium" 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddTracker}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Deploy Sentinel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, isDarkMode }: { label: string; value: string | number; icon: ReactNode; isDarkMode: boolean }) {
  return (
    <div className={`rounded-3xl border transition-all p-6 shadow-sm hover:shadow-md group ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{label}</p>
        <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{value}</p>
    </div>
  );
}

function ActivityItem({ icon, bg, title, desc, time, isDarkMode }: { icon: ReactNode; bg: string; title: string, desc: string, time: string, isDarkMode: boolean }) {
  return (
    <div className="flex gap-4 group">
      <div className={`${bg} p-3 rounded-2xl h-11 w-11 flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`font-bold transition-colors uppercase text-[10px] tracking-widest ${isDarkMode ? 'text-neutral-300 group-hover:text-indigo-400' : 'text-neutral-900 group-hover:text-indigo-600'}`}>{title}</p>
          <p className="text-[10px] text-neutral-500 font-black">{time}</p>
        </div>
        <p className={`text-xs font-medium leading-tight ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>{desc}</p>
      </div>
    </div>
  );
}

const CATEGORY_ICONS = {
  flight: <Zap className="text-blue-500" size={24} />,
  product: <Search className="text-indigo-500" size={24} />,
  hotel: <Bell className="text-amber-500" size={24} />,
  event: <CheckCircle className="text-green-500" size={24} />,
};

function RecommendationBadge({ recommendation }: { recommendation: Tracker['recommendation'] }) {
  const styles = {
    buy: 'bg-green-500 text-white border-transparent',
    wait: 'bg-amber-500 text-white border-transparent',
    unknown: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  };

  const icons = {
    buy: <TrendingUp size={16} />,
    wait: <TrendingDown size={16} />,
    unknown: <AlertCircle size={16} />,
  };
  
  const text = {
    buy: 'Buy Now!',
    wait: 'Wait',
    unknown: 'Analying',
  };

  return (
    <span className={`flex items-center gap-2 rounded-2xl border px-5 py-2 text-sm font-black shadow-lg shadow-neutral-100 ${styles[recommendation]}`}>
      {icons[recommendation]}
      {text[recommendation]}
    </span>
  );
}

function StatusBadge({ status }: { status: Tracker['status'] }) {
  const styles = {
    monitoring: 'bg-blue-50 text-blue-600 border-blue-100',
    available: 'bg-green-50 text-green-600 border-green-100',
    'price-dropped': 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const icons = {
    monitoring: <RefreshCw size={14} className="animate-spin-slow" />,
    available: <CheckCircle size={14} />,
    'price-dropped': <AlertCircle size={14} />,
  };

  return (
    <span className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
      {icons[status]}
      {status.replace('-', ' ')}
    </span>
  );
}
