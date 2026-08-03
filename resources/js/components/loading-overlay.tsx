import { motion, AnimatePresence } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';

export default function LoadingOverlay({ show }: Readonly<{ show: boolean }>) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-xl"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="flex flex-col items-center gap-4 rounded-2xl bg-white/10 px-10 py-8 backdrop-blur-xl"
                    >
                        <LoaderCircle size={48} className="animate-spin text-cyan-400" />
                        <p className="text-sm font-medium text-white">Loading...</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
