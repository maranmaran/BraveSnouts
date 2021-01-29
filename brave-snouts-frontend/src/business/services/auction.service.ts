import * as moment from "moment";
import { Auction } from "src/business/models/auction.model";

export function getAuctionState(auction: Auction): 'future' | 'active' | 'expired' {

    let state: 'future' | 'active' | 'expired' = 'active';

    if (isFutureAuction(auction)) {
        state = 'future'
    }

    if (isExpiredAuction(auction)) {
        state = 'expired'
    }

    return state;
}

/**Auction that is set in future and is yet to come */
function isFutureAuction(auction: Auction) {
    return moment(auction.startDate.toDate()).isAfter(new Date());
}

/**Auction that has ended and/or is processed by firebase function*/
function isExpiredAuction(auction: Auction) {
    return (moment(auction.endDate.toDate()).isBefore(new Date()) || auction.processed) && !isFutureAuction(auction);
}

