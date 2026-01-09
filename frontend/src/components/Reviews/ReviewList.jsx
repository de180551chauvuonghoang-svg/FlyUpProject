import { Star, User } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const ReviewList = ({ reviews, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-[#1A1333] p-4 rounded-xl border border-white/5">
            <div className="flex gap-4">
              <div className="size-10 bg-white/5 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-white/5 rounded" />
                <div className="h-3 w-1/6 bg-white/5 rounded" />
                <div className="h-16 w-full bg-white/5 rounded mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 bg-[#1A1333] rounded-xl border border-white/5">
        <p>No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review, index) => (
        <Motion.div
          key={review.Id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-[#1A1333] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/10">
              {review.user?.AvatarUrl ? (
                 <img src={review.user.AvatarUrl} alt={review.user.FullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User size={20} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{review.user?.FullName || 'Anonymous User'}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.Rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-slate-600 fill-slate-900'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(review.CreationTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {review.Content}
              </p>
            </div>
          </div>
        </Motion.div>
      ))}
    </div>
  );
};

export default ReviewList;
