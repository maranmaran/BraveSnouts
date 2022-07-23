import axios from 'axios';
import { logger } from 'firebase-functions';
import { europeFunctions, store } from "..";

/** Function executed every morning picks up 30+ days old 
 * auctions and marks them as **archived**  
 * CRON Schedule: At 06:00 on every day-of-week from Sunday through Saturday. */
export const fetchEurCurrencyFn = europeFunctions.pubsub.schedule('every 4 hours')
    .timeZone('Europe/Zagreb')
    .onRun(async ctx => {

        try {
            const response = await axios.get<HnbCurrencyResponse[]>(
                "https://api.hnb.hr/tecajn/v1?valuta=EUR"
            );

            console.info(JSON.stringify(response.data));

            const eurRate = parseFloat(response.data[0]['Srednji za devize'].toString().replace(',', '.'));

            logger.info("EUR conversion rate: " + eurRate);

            await store.doc("config/global").update({ eurRate: eurRate });

        } catch (e) {
            logger.error(e);
            throw e;
        }
    });

interface HnbCurrencyResponse {
    "Srednji za devize": number
}