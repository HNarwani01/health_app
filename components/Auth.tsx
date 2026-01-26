
import React, { useState } from 'react';
import { Card, Heading, Button, Text } from './ui/Layout';

interface AuthProps {
  onLogin: () => void;
}

export const AuthScreen: React.FC<AuthProps> = ({ onLogin }) => {
  const [method, setMethod] = useState<'selection' | 'email'>('selection');
  const [loading, setLoading] = useState(false);
  
  // Email Flow States
  const [email, setEmail] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    setLoading(true);
    // Simulate network delay 0-2000ms
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, Math.random() * 2000);
  };

  const handleEmailSubmit = () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setError('');
    setShowOtp(true);
  };

  const handleOtpSubmit = () => {
    // Validation: Numeric only, not empty
    if (!otp) {
      setError('OTP cannot be empty.');
      return;
    }
    if (!/^\d+$/.test(otp)) {
      setError('OTP must contain numbers only.');
      return;
    }
    
    // Success
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <div className="text-center animate-pulse">
          <div className="text-4xl mb-4">🔐</div>
          <Heading level={2}>Authenticating...</Heading>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Heading level={1} className="mb-2">QuickChef <span className="text-[#4c63d9]">Pro</span></Heading>
          <Text>Sign in to access your AI Meal Planner</Text>
        </div>

        {method === 'selection' && (
          <div className="space-y-4">
            <Button onClick={handleGoogleLogin} className="w-full !bg-white !text-slate-700 !border-slate-200 hover:!bg-slate-50 relative">
              <span className="mr-2">G</span> Continue with Google (Mock)
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">Or</span></div>
            </div>
            <Button onClick={() => setMethod('email')} className="w-full">
              Continue with Email
            </Button>
          </div>
        )}

        {method === 'email' && !showOtp && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email Address</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#4c63d9]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button onClick={handleEmailSubmit} className="w-full">Send OTP</Button>
            <button onClick={() => setMethod('selection')} className="w-full text-sm text-slate-400 mt-2">Back</button>
          </div>
        )}

        {method === 'email' && showOtp && (
          <div className="space-y-4">
             <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Enter OTP</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#4c63d9] tracking-widest text-center text-xl font-mono"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="0000"
                maxLength={6}
              />
              <div className="text-xs text-slate-400 mt-1 text-center">Any numbers allowed for demo</div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button onClick={handleOtpSubmit} className="w-full">Verify & Login</Button>
            <button onClick={() => setShowOtp(false)} className="w-full text-sm text-slate-400 mt-2">Back</button>
          </div>
        )}
      </Card>
    </div>
  );
};
