const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");

const {
    COINBASE_API_KEY,
    COINBASE_WEBHOOK_SECRET,
    DOMAIN,
} = require("./config");

const { Client, resources, Webhook } = require("coinbase-commerce-node");

Client.init(COINBASE_API_KEY);

const { Charge } = resources;
const app = express({});

app.use(cors());
app.use(morgan("dev"));
app.use(
    express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
    })
);

app.get("/create-charge", async(req, res) => {
    const chargeData = {
        name: "Croquetas 1 kg",
        description: "Apoya a animalitos de la calle",
        local_price: {
            amount: "1",
            currency: "USD",
        },
        pricing_type: "fixed_price",
        metadata: {
            customer_id: "1",
            customer_name: "Gustavo Lopez",
        },
        redirect_url: `${DOMAIN}/charge-success`,
        cancel_url: `${DOMAIN}/charge-cancel`,
    };
    const charge = await Charge.create(chargeData);

    res.send(charge);
});

app.post("/payment-handler", (req, res) => {
    const rawBody = req.rawBody;
    const signature = req.headers["x-cc-webhook-signature"];
    const webhookSecret = COINBASE_WEBHOOK_SECRET;

    let event;
    try {
        event = Webhook.verifyEventBody(rawBody, signature, webhookSecret);

        if (event.type === "charge:pending") {
            console.log("Charge is pending");
        }
        if (event.type === "charge:confirmed") {
            console.log("Charge is confirmed");
        }
        if (event.type === "charge:failed") {
            console.log("Charge is failed");
        }
    } catch (error) {
        console.log(error);
        res.status(400).send("failed");
    }

    return res.status(200).send(evend.id);
});

app.get("/charge-success", (req, res) => {
    res.send("Payment successfull");
});

app.get("/charge-cancel", (req, res) => {
    res.send("Payment cancel");
});

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT);
console.log("Server on port", PORT);