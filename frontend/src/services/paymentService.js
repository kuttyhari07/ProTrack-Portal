import api from './api';

/**
 * Dynamically loads the Razorpay checkout script if not already present
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Initiates Razorpay payment for project creation
 * @param {Object} options
 * @param {Object} options.projectData - Project details
 * @param {Object} options.user - Current logged in user
 * @param {Function} options.onSuccess - Callback on verification success
 * @param {Function} options.onError - Callback on payment error
 * @param {Function} options.onModalDismiss - Callback when user closes payment modal
 */
export const initiateProjectPayment = async ({
  projectData,
  user,
  onSuccess,
  onError,
  onModalDismiss
}) => {
  try {
    // 1. Create order on backend
    const orderRes = await api.post('/payments/razorpay/create-order', {
      projectData
    });

    if (!orderRes.data.success) {
      throw new Error(orderRes.data.message || 'Failed to create payment order');
    }

    const { orderId, amount, amountInr, currency, keyId, paymentId } = orderRes.data;

    // 2. Ensure Razorpay script is loaded
    const isLoaded = await loadRazorpayScript();

    // Check if in simulation/test mode or real Razorpay SDK available
    if (isLoaded && window.Razorpay && !keyId.includes('test_protrack2026')) {
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'ProTrack SaaS',
        description: `Project Launch Fee: ${projectData.name}`,
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
        order_id: orderId,
        handler: async function (response) {
          try {
            // 3. Verify signature on backend
            const verifyRes = await api.post('/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId,
              projectData
            });

            if (verifyRes.data.success) {
              onSuccess && onSuccess(verifyRes.data);
            } else {
              onError && onError(new Error(verifyRes.data.message || 'Payment verification failed'));
            }
          } catch (verifyErr) {
            onError && onError(verifyErr);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: ''
        },
        notes: {
          projectName: projectData.name,
          dueDate: projectData.dueDate
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: function () {
            onModalDismiss && onModalDismiss();
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        onError && onError(new Error(response.error.description || 'Payment transaction failed'));
      });
      razorpayInstance.open();
    } else {
      // Development Test Mode Simulation:
      // When testing with dummy keys or local sandbox, simulate the payment verification call
      console.log('[Razorpay Test Mode] Simulating instant checkout verification...');

      const simPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const verifyRes = await api.post('/payments/razorpay/verify', {
        razorpay_order_id: orderId,
        razorpay_payment_id: simPaymentId,
        razorpay_signature: 'simulated_test_signature',
        paymentId,
        projectData
      });

      if (verifyRes.data.success) {
        onSuccess && onSuccess(verifyRes.data);
      } else {
        onError && onError(new Error(verifyRes.data.message || 'Payment verification failed'));
      }
    }
  } catch (err) {
    console.error('Payment initiation error:', err);
    onError && onError(err);
  }
};
