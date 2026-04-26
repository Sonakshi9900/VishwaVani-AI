import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const TranslateSkeleton = () => (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="glass-card p-8 border-secondary/50 bg-secondary/5"
    >
        <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
            <div className="h-6 bg-gray-600 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-600 rounded w-full animate-pulse" style={{ width: `${100 - i * 5}%` }}></div>
            ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            <span className="text-purple-400 text-sm ml-2">AI is translating...</span>
        </div>
    </motion.div>
);

export const SummarizeSkeleton = () => (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="glass-card p-8 border-accent/50 bg-accent/5"
    >
        <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
            <div className="h-6 bg-gray-600 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-600 rounded w-full animate-pulse" style={{ width: `${100 - i * 5}%` }}></div>
            ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
            <div className="relative w-6 h-6">
                <div className="absolute inset-0 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
            <span className="text-purple-400 text-sm ml-2">AI is generating summary...</span>
        </div>
    </motion.div>
);

export const FullPageLoader = ({ message }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
            </div>
            <p className="text-white font-semibold text-lg">{message}</p>
            <div className="flex items-center justify-center gap-1 mt-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </motion.div>
    </motion.div>
);