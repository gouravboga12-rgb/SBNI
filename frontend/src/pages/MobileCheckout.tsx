import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle2, ShieldCheck, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import {
  createRazorpayPaymentSession,
  verifyRazorpayPayment,
  getRazorpayKey,
  fetchSubscriptionPlans,
  safeSetLocalStorage,
} from '../services/api';

export const MobileCheckout: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'processing' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [isAutoPay, setIsAutoPay] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    initCheckout();
  }, []);

  const initCheckout = async () => {
    try {
      setStatus('loading');
      setErrorMessage('');

      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get('token');
      const planId = searchParams.get('planId');
      const autoPayParam = searchParams.get('isAutoPay') === 'true';
      const walletParam = searchParams.get('useWallet') === 'true';

      setIsAutoPay(autoPayParam);
      setUseWallet(walletParam);

      if (urlToken) {
        setToken(urlToken);
        safeSetLocalStorage('sbni_token', urlToken);
      }

      if (!planId) {
        setStatus('error');
        setErrorMessage('No plan selected. Please return to the JustPaisa app.');
        return;
      }

      // Load plan details
      const plans = await fetchSubscriptionPlans('VENDOR');
      const matchedPlan = plans.find((p: any) => p.id === planId || p.code === planId) || {
        id: planId,
        name: 'JustPaisa VIP Membership',
        price: 249,
        durationDays: 30,
      };
      setPlan(matchedPlan);

      // Load Razorpay script if needed
      if (typeof (window as any).Razorpay === 'undefined') {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay payment gateway SDK.'));
          document.body.appendChild(script);
        });
      }

      setStatus('ready');
      // Automatically trigger payment on mobile
      launchPayment(matchedPlan, autoPayParam, walletParam);
    } catch (err: any) {
      console.error('Init checkout error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to initialize payment.');
    }
  };

  const launchPayment = async (targetPlan: any, autoPay: boolean, wallet: boolean) => {
    try {
      setStatus('processing');
      const session = await createRazorpayPaymentSession(targetPlan.id, autoPay, undefined, wallet);
      if (!session.success) {
        throw new Error(session.message || 'Unable to initiate payment session with server.');
      }

      const rzpKey = session.keyId || (await getRazorpayKey());

      const options: any = {
        key: rzpKey,
        name: 'JustPaisa Money App',
        description: `${targetPlan.name} Membership (${autoPay ? 'AutoPay' : 'One-time'})`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        prefill: {
          name: 'JustPaisa Partner',
          email: 'partner@justpaisa.in',
          contact: '9876543210',
        },
        theme: {
          color: '#003893',
        },
        handler: async (response: any) => {
          try {
            setStatus('processing');
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpay_subscription_id: response.razorpay_subscription_id || session.subscriptionId,
              planId: targetPlan.id,
              couponCode: undefined,
              isAutoPay: autoPay,
              useWallet: wallet,
            });

            if (verifyRes.success) {
              safeSetLocalStorage('sbni_subscribed', 'true');
              setStatus('success');
              // Automatically return to JustPaisa App via deep link
              setTimeout(() => {
                window.location.href = 'justpaisa://payment-success';
              }, 1200);
            } else {
              setStatus('error');
              setErrorMessage(verifyRes.message || 'Payment confirmation failed.');
            }
          } catch (verErr: any) {
            setStatus('error');
            setErrorMessage(verErr.message || 'Error confirming payment with server.');
          }
        },
        modal: {
          ondismiss: () => {
            setStatus('ready');
          },
        },
      };

      if (session.mode === 'subscription' && session.subscriptionId) {
        options.subscription_id = session.subscriptionId;
      } else if (session.orderId) {
        options.order_id = session.orderId;
        options.amount = session.amountPaise || (session.amount ? session.amount * 100 : 100);
        options.currency = session.currency || 'INR';
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Launch payment error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Unable to open payment gateway.');
    }
  };

  const returnToApp = (statusParam: string = 'success') => {
    window.location.href = `justpaisa://payment-${statusParam}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8 text-center">
        {/* Logo & Header */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Crown size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          JustPaisa Secure Checkout
        </h1>
        <p className="text-xs font-semibold text-slate-500 mb-6">
          100% Encrypted • Official Razorpay Gateway
        </p>

        {/* Plan Summary Card */}
        {plan && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left">
            <div className="flex justify-between items-center mb-1">
              <span className="font-extrabold text-slate-900 text-base">{plan.name}</span>
              <span className="text-xl font-black text-blue-700">₹{plan.price}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Duration: <span className="font-bold text-slate-700">{plan.durationDays} Days</span> • Stacking Validity Enabled
            </p>
          </div>
        )}

        {/* Status Views */}
        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center gap-3">
            <RefreshCw className="animate-spin text-blue-600" size={36} />
            <p className="text-sm font-bold text-slate-600">Connecting to secure checkout...</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="py-8 flex flex-col items-center gap-3">
            <RefreshCw className="animate-spin text-blue-600" size={36} />
            <p className="text-sm font-bold text-slate-700">Confirming payment with bank...</p>
            <p className="text-xs text-slate-400">Please do not close this window</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Payment Successful!</h2>
            <p className="text-sm text-slate-600 font-medium">
              Your VIP membership validity has been stacked!
            </p>
            <button
              onClick={() => returnToApp('success')}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-600/30 transition-all text-sm flex items-center justify-center gap-2"
            >
              Return to JustPaisa App
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Payment Incomplete</h2>
            <p className="text-xs text-rose-600 font-medium px-2">{errorMessage}</p>
            <div className="mt-4 w-full flex flex-col gap-2">
              <button
                onClick={() => launchPayment(plan, isAutoPay, useWallet)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-6 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                Retry Payment
              </button>
              <button
                onClick={() => returnToApp('cancelled')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                Return to App
              </button>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="py-4 flex flex-col items-center gap-4">
            <button
              onClick={() => launchPayment(plan, isAutoPay, useWallet)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-blue-600/25 transition-all text-base flex items-center justify-center gap-2"
            >
              Open Razorpay Gateway
            </button>
            <button
              onClick={() => returnToApp('cancelled')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back to JustPaisa App
            </button>
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-xs font-semibold">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Secured by 256-Bit SSL Encryption</span>
        </div>
      </div>
    </div>
  );
};
