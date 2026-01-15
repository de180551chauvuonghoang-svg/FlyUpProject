
import React, { useState, useEffect } from 'react';
import { fetchTransactionHistory } from '../../services/transactionService';
import { format, isValid } from 'date-fns';
import { ShoppingBag, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await fetchTransactionHistory();
        setTransactions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-400 flex flex-col items-center gap-2">
        <AlertCircle className="w-6 h-6" />
        <p>{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 bg-[#16161e] rounded-2xl border border-white/5">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Transactions Yet</h3>
        <p className="text-slate-400">You haven't made any purchases yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {transactions.map((transaction) => (
        <div 
          key={transaction.id} 
          className="bg-[#16161e] border border-white/5 rounded-2xl p-6 hover:border-violet-500/20 transition-all overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${transaction.status === 'Successful' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {transaction.status === 'Successful' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm text-slate-400">Transaction ID</p>
                <p className="font-mono text-white text-sm">{transaction.transactionId}</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-slate-400">Date</p>
              <p className="text-white">
                {transaction.date && isValid(new Date(transaction.date)) 
                  ? format(new Date(transaction.date), 'MMM dd, yyyy • HH:mm')
                  : '-'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {transaction.items.map((item) => (
              <div key={item.courseId} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl">
                <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                  <img src={item.thumbnail || '/placeholder-course.jpg'} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{item.title}</h4>
                  <p className="text-slate-400 text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-slate-400">Total Amount</span>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory;
