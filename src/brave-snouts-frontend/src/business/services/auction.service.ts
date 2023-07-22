import { isAfter, isBefore } from "date-fns";
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
    if (auction.startDate instanceof Date) {
        return isAfter(auction.startDate, new Date())
    }

    return isAfter(auction.startDate.toDate(), new Date());
}

/**Auction that has ended and/or is processed by firebase function*/
function isExpiredAuction(auction: Auction) {
    if (auction.endDate instanceof Date) {
        return isAfter(auction.endDate, new Date())
    }

    return isBefore(auction.endDate.toDate(), new Date()) || auction.processed && !isFutureAuction(auction)
}

