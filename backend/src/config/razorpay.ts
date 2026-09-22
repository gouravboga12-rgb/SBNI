import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

export const razorpayKeyId =
  process.env.RAZORPAY_KEY_ID ||
  process.env.PAYMENT_GATEWAY_KEY ||
  'rzp_live_TexGNKmorGENez';

export const razorpayKeySecret =
  process.env.RAZORPAY_KEY_SECRET ||
  process.env.PAYMENT_GATEWAY_SECRET ||
  'HBa7VyzFqoJeiv1x4Roe71p8';

export const razorpayInstance = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

export default razorpayInstance;
