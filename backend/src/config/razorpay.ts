import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

export const razorpayKeyId =
  process.env.RAZORPAY_KEY_ID ||
  process.env.PAYMENT_GATEWAY_KEY ||
  'rzp_test_TUjAguyFqbDjNk';

export const razorpayKeySecret =
  process.env.RAZORPAY_KEY_SECRET ||
  process.env.PAYMENT_GATEWAY_SECRET ||
  'D4YjSHAm3hHLBqpGtcfE5HTs';

export const razorpayInstance = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

export default razorpayInstance;
