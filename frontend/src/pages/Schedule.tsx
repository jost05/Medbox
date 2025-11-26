import React, { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import type { Magazine } from '../../../types';
import { firestore } from '../services/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { Calendar, Plus, Clock, Pill, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

// Define Interface for a Plan Item
interface PlanItem {
  magazineId: number | string;
  magazineName: string;
  amount: number;
}

interface Plan {
  id: string;
  scheduledAt: string;
  items?: PlanItem[]; // New structure
  magazineName?: string; // Backwards compatibility
  status: string;
}

function SchedulePage({ user }: { user: User }) {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  const [selections, setSelections] = useState<Record<string, number>>({});
  
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');

  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // 1. Triggered when clicking the Trash icon
  const promptDelete = (planId: string) => {
    setPlanToDelete(planId);
  };

  // 2. Triggered when clicking "Yes, Cancel" in the modal
  const confirmDelete = async () => {
    if (!planToDelete) return;
    
    try {
      await deleteDoc(doc(firestore!, 'plans', planToDelete));
      setPlanToDelete(null); // Close modal on success
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("Error deleting plan"); // Optional: Replace with setErrorMsg if you prefer
    }
  };


  // 1. Fetch Magazines
  useEffect(() => {
    const q = query(collection(firestore!, 'magazines'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMagazines(snap.docs.map(d => ({ _id: d.id, ...d.data() } as Magazine)));
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Fetch Scheduled Plans
  useEffect(() => {
    const q = query(
      collection(firestore!, 'plans'), 
      where('status', '==', 'PENDING'),
      orderBy('scheduledAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)));
    });
    return () => unsubscribe();
  }, [user]);

  // Helpers
  const toggleSelection = (magId: string | number) => {
    const idStr = magId.toString();
    setSelections(prev => {
      const newSelections = { ...prev };
      if (newSelections[idStr]) delete newSelections[idStr];
      else newSelections[idStr] = 1;
      return newSelections;
    });
  };

  const handleAmountChange = (magId: string | number, amount: string) => {
    const val = parseInt(amount);
    if (val < 1) return;
    setSelections(prev => ({ ...prev, [magId.toString()]: val }));
  };

  const handleDeletePlan = async (planId: string) => {
    if(!window.confirm("Are you sure you want to cancel this plan?")) return;
    try { await deleteDoc(doc(firestore!, 'plans', planId)); } 
    catch (error) { console.error("Error deleting plan:", error); }
  };

  const handlePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedIds = Object.keys(selections);
    
    if (selectedIds.length === 0 || !time) {
        setErrorMsg("Please select at least one medication and a time.");
        setTimeout(() => setErrorMsg(''), 4000);
        return;
    }
    
    // Clear any previous errors
    setErrorMsg('');
    setLoading(true);

    const today = new Date();
    const [hours, minutes] = time.split(':');
    const scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
    
    if (scheduledDate < new Date()) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const itemsToDispense: PlanItem[] = selectedIds.map(id => {
        const mag = magazines.find(m => m.id.toString() === id);
        return {
            magazineId: mag ? mag.id : id,
            magazineName: mag ? mag.name : 'Unknown',
            amount: selections[id]
        };
    });

    try {
        await addDoc(collection(firestore!, 'plans'), {
          type: 'Scheduled Dispense',
          items: itemsToDispense,
          scheduledAt: scheduledDate.toISOString(),
          status: 'PENDING',
          createdAt: serverTimestamp()
        });
    
        setSuccessMsg('Schedule updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
        
        setTime('');
        setSelections({});
    } catch (err) {
        console.error("Error scheduling:", err);
        setErrorMsg("Failed to save schedule. Please try again."); // Handle save error too
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* LEFT COLUMN: The Scheduler Form */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">New Schedule</h2>
        
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-6 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl text-cyan-800 dark:text-cyan-300">
            <Calendar className="h-6 w-6 shrink-0" />
            <p className="text-sm">
              Select medications and quantities. They will dispense together at the set time.
            </p>
          </div>

          <form onSubmit={handlePlan} className="space-y-6">
            
            {/* Multi-Select List */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Select Medications & Amount
              </label>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {magazines.map(m => {
                    const isSelected = !!selections[m.id.toString()];
                    return (
                        <div 
                            key={m.id} 
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                isSelected 
                                ? 'bg-cyan-50 border-cyan-500/50 dark:bg-cyan-900/20 dark:border-cyan-500/50' 
                                : 'bg-slate-50 border-transparent dark:bg-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelection(m.id)}
                                    className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500 border-gray-300"
                                />
                                <div>
                                    <p className="font-medium text-slate-700 dark:text-slate-200">{m.name}</p>
                                    <p className="text-xs text-slate-500">{m.type} • {m.percentage}% Left</p>
                                </div>
                            </div>

                            {isSelected && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                                    <span className="text-xs text-slate-400">Qty:</span>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={selections[m.id.toString()]}
                                        onChange={(e) => handleAmountChange(m.id, e.target.value)}
                                        className="w-16 px-2 py-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Time of Dispense</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={time}
                  onClick={(e) => {
                    try {
                      if ('showPicker' in HTMLInputElement.prototype) {
                        e.currentTarget.showPicker();
                      }
                    } catch (err) {
                      // Fallback for older browsers or if prevented
                    }
                  }}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-700 dark:text-slate-200 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Clock size={20} />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium animate-in fade-in flex items-center justify-center gap-2">
                 <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : <><Plus size={20} /> Add to Schedule</>}
            </button>
          </form>

          {successMsg && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-center text-sm font-medium animate-fade-in flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col h-full">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Upcoming Schedule</h2>
         
         <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {plans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <Calendar className="h-10 w-10 mb-2 opacity-50" />
                    <p>No upcoming plans</p>
                </div>
            ) : (
                plans.map(plan => {
                    const date = new Date(plan.scheduledAt);
                    return (
                        <div key={plan.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative group">
                            
                            {/* Header: Time */}
                            <div className="flex items-center gap-3 mb-3 text-slate-800 dark:text-white">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-lg leading-none">
                                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">
                                        {date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric'})}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Divider */}
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-3" />

                            {/* Body: Items */}
                            <div className="space-y-2">
                                {plan.items && plan.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Pill size={14} className="opacity-50" />
                                            <span>{item.magazineName}</span>
                                        </div>
                                        <span className="font-mono font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 text-xs">
                                            x{item.amount}
                                        </span>
                                    </div>
                                ))}
                                {/* Backwards Compat */}
                                {!plan.items && plan.magazineName && (
                                     <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Pill size={14} className="opacity-50" />
                                            <span>{plan.magazineName}</span>
                                        </div>
                                        <span className="font-mono font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 text-xs">
                                            x1
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Delete Action */}
                            <button 
                                onClick={() => promptDelete(plan.id)}
                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Cancel Plan"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )
                })
            )}
         </div>
      </div>

            {/* DELETE CONFIRMATION MODAL */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-sm w-full p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center gap-4">
              
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">
                <Trash2 size={24} />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cancel Plan?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to remove this scheduled dispense? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setPlanToDelete(null)}
                  className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Keep it
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm hover:shadow-md"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SchedulePage;