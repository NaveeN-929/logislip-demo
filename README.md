# logislip

## Setup

1. Install dependencies:

```bash
npm install
```

2. Environment variables (create `.env` in project root):

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
REACT_APP_UPI_MERCHANT_ID=your-upi-id@upi
REACT_APP_UPI_MERCHANT_NAME=LogiSlip
```

If deploying with Netlify Functions, also set server-side env vars in Netlify dashboard:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret
```

3. Start the dev server:

```bash
npm start
```

### Razorpay integration

- The app uses Supabase Edge Functions: `razorpay-order` (create order) and `razorpay-verify` (verify signature). On success, a Postgres function `activate_subscription` updates user subscription and payment status.
