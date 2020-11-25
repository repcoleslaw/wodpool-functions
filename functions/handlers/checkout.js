const {db} = require('../util/admin');
const stripe = require('stripe')('sk_test_51HlxquAvhko8QPKDOBWH27n1IULMpkvurX3e2De6yAssfHdZt2uD6KweyP1XM7ckP1ioa7RmsqK08yxm04KRdpXA00yIXH90Aq');

exports.checkout = async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "T-shirt",
          },
          unit_amount: 2000,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
  })
  .catch((err) => {
    console.error(err);
  });
  ;

  res.json({ id: session.id })
};