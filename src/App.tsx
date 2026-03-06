import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shirt, 
  CheckCircle2, 
  History, 
  User, 
  Plus, 
  Trash2, 
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

type Owner = 'Me' | 'Father' | 'Brother';
type ItemType = 'Socks' | 'Boxers';

interface LaundryItem {
  id: number;
  owner: Owner;
  type: ItemType;
  status: 'dirty' | 'clean';
  created_at: string;
}

const OWNERS: Owner[] = ['Me', 'Father', 'Brother'];
const ITEM_TYPES: ItemType[] = ['Socks', 'Boxers'];

export default function App() {
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMomMode, setIsMomMode] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError('Could not connect to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Polling for "real-time" feel
    return () => clearInterval(interval);
  }, []);

  const dropItem = async (owner: Owner, type: ItemType) => {
    try {
      const res = await fetch('/api/drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, type }),
      });
      if (!res.ok) throw new Error('Failed to drop item');
      fetchStatus();
    } catch (err) {
      alert('Error dropping item');
    }
  };

  const cleanItem = async (id: number) => {
    try {
      const res = await fetch('/api/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to clean item');
      fetchStatus();
    } catch (err) {
      alert('Error cleaning item');
    }
  };

  const cleanAll = async (owner: Owner, type: ItemType) => {
    try {
      const res = await fetch('/api/clean-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, type }),
      });
      if (!res.ok) throw new Error('Failed to clean items');
      fetchStatus();
    } catch (err) {
      alert('Error cleaning items');
    }
  };

  const getCount = (owner: Owner, type: ItemType) => {
    return items.filter(i => i.owner === owner && i.type === type).length;
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen pb-20 px-4 pt-8">
      {/* Header */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Laundry</h1>
          <p className="text-stone-500 text-sm">Who dropped what?</p>
        </div>
        <button 
          onClick={() => setIsMomMode(!isMomMode)}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            isMomMode 
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
              : 'bg-stone-200 text-stone-600 border border-stone-300'
          }`}
        >
          {isMomMode ? 'Mom Mode: ON' : 'Switch to Mom Mode'}
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="space-y-8">
        {OWNERS.map((owner) => (
          <section key={owner} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <User className="w-4 h-4 text-stone-400" />
              <h2 className="font-display font-semibold text-lg">{owner}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {ITEM_TYPES.map((type) => {
                const count = getCount(owner, type);
                return (
                  <div 
                    key={type}
                    className={`relative p-5 rounded-3xl border transition-all duration-300 ${
                      count > 0 
                        ? 'bg-white border-stone-200 shadow-sm' 
                        : 'bg-stone-100/50 border-stone-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        {type}
                      </span>
                      {count > 0 && (
                        <motion.span 
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold"
                        >
                          {count}
                        </motion.span>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      {!isMomMode ? (
                        <button
                          onClick={() => dropItem(owner, type)}
                          className="w-full py-3 bg-stone-900 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-stone-800 active:scale-95 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-sm font-semibold">Drop Dirty</span>
                        </button>
                      ) : (
                        <button
                          disabled={count === 0}
                          onClick={() => cleanAll(owner, type)}
                          className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            count > 0 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-semibold">Mark Clean</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Recent Activity (Mom Mode only) */}
      <AnimatePresence>
        {isMomMode && items.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12 space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="font-display font-semibold text-stone-500 uppercase text-xs tracking-widest">
                Pending Items Log
              </h3>
              <History className="w-4 h-4 text-stone-300" />
            </div>
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden divide-y divide-stone-100">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                      <Shirt className="w-4 h-4 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {item.owner}'s {item.type}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        Dropped {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => cleanItem(item.id)}
                    className="p-2 text-stone-300 hover:text-emerald-600 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="mt-20 text-center space-y-4">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-stone-300" />
          </div>
          <p className="text-stone-400 text-sm font-medium">Everything is clean!</p>
        </div>
      )}

      {/* Footer hint */}
      <footer className="mt-12 text-center">
        <p className="text-[10px] text-stone-300 uppercase tracking-[0.2em]">
          Family Laundry Sync v1.0
        </p>
      </footer>
    </div>
  );
}
