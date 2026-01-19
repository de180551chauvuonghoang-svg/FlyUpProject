import { motion as Motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, X, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ShareModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
        {/* Backdrop */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <Motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-[#1e1e2e]/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img src="/FlyUpLogin.png" alt="FlyUp Logo" className="h-16 object-contain" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Share this page</h3>
            <p className="text-gray-400 text-sm">
              Scan the QR code or copy the link below
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-6 shadow-lg">
            <QRCodeSVG
              value={currentUrl}
              size={200}
              level="H"
              includeMargin={false}
              className="w-full h-full"
              imageSettings={{
                src: "/FlyUpTeam.png",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          {/* Copy Link Section */}
          <div className="relative">
            <div className="flex items-center gap-2 p-3 bg-black/20 rounded-xl border border-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400 truncate font-mono">
                  {currentUrl}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  copied
                    ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
