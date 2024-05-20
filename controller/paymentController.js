const paypal = require("paypal-rest-sdk");
const { PAYPAL_MODE, PAYPAL_CLIENT_KEY, PAYPAL_SECRET_KEY } = process.env;

paypal.configure({
  mode: PAYPAL_MODE,
  client_id: PAYPAL_CLIENT_KEY,
  client_secret: PAYPAL_SECRET_KEY,
});

const doPayment = async (req, res) => {
  try {
    const total = req.query.total;

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:3000/paymentSucess",
        cancel_url: "http://localhost:3000/products",
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: "Book",
                sku: "001",
                price: total,
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: total,
          },
          description: "Hat for the best team ever",
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (err, payment) {
      if (err) {
        throw err;
      } else {
        req.session.paymentId = payment.id;
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            res.redirect(payment.links[i].href);
          }
        }
      }
    });
  } catch (error) {
    console.log(
      "Error While Accepting the Payment Request from the User :" + error
    );
  }
};

const paymentSucessPage = (req, res) => {
  try {
    res.render("userViews/orderSuccess");
  } catch (error) {
    console.log("Error While Rendering the Payment Success Page: " + error);
  }
};

// const { PAYPALMODE,PAYPAL_CLINT_KEY,PAYPAL_SECRET_KEY}=process.env

// paypal.configure({
//     'mode':PAYPALMODE,
//     'client_id':PAYPAL_CLINT_KEY,
//     'client_secret':PAYPAL_SECRET_KEY
// })

// const paymentPage=async(req,res)=>{
//     const card=await cartCollection.find({userId:req.query.id})

//     const total=req.session.cartTotal
//     req.session.total=total
// try{
//     const create_payment_json = {
//         'intent': 'sale',
//         'payer': {
//             'payment_method': 'paypal'
//         },
//         'redirect_urls': { // Change made here: redirect_urls instead of redirect_url
//             'return_url': 'http://localhost:8001/checkout5',
//             'cancel_url': 'http://localhost:8001/shop'
//         },
//            "transactions": [{
//                 "item_list": {
//                     "items": [{
//                         "name": "book",
//                         "sku": "001",
//                         "price":total ,
//                         "currency": "USD",
//                         "quantity": 1
//                     }]
//                 },
//                 "amount": {
//                     "currency": "USD",
//                     "total": total // Fix the total amount to 2 decimal places
//                 },
//                 "description": "This is the payment description.",

//             }]
//         };

//    paypal.payment.create(create_payment_json,async function(error,payment){
//         if(error){
//             throw error;
//         }else{

//               req.session.paymentId=payment.id
//             console.log('hai')
//             for(let i=0;payment.links.length;i++){
//                 if(payment.links[i].rel==='approval_url'){

//                     return res.redirect(payment.links[i].href)

//             }
//         }
//           }
//          }
//         )
// }

module.exports = { doPayment, paymentSucessPage };
