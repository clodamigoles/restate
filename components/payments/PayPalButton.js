import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

export default function PayPalButton({ bookingId, onSuccess, onError }) {
  const [{ isPending }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="h-12 animate-pulse rounded-lg bg-muted" />
    );
  }

  async function createOrder() {
    const res = await fetch('/api/payments/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data.orderId;
  }

  async function onApprove(data) {
    const res = await fetch('/api/payments/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: data.orderID, bookingId }),
    });
    const result = await res.json();
    if (!result.success) {
      onError?.(result.error);
      return;
    }
    onSuccess?.(result.data);
  }

  return (
    <PayPalButtons
      style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={(err) => onError?.(err.message || 'Erreur PayPal')}
    />
  );
}
