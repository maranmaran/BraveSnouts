import { isAfter, isBefore } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Auction } from "src/business/models/auction.model";

export type AuctionState = 'future' | 'active' | 'expired';

export function getAuctionState(auction: Auction): AuctionState {

    let state: AuctionState = 'active';

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
    return isAfter(ensureTimestamp(auction.startDate).toDate(), new Date());
}

/**Auction that has ended and/or is processed by firebase function*/
function isExpiredAuction(auction: Auction) {
    if (auction.endDate instanceof Date) {
        return isAfter(auction.endDate, new Date())
    }

    const before = isBefore(ensureTimestamp(auction.endDate).toDate(), new Date());

    const expired = before || auction.processed && !isFutureAuction(auction)

    return expired;
}

function ensureTimestamp(date: Timestamp | Date | Object) {
    if (date instanceof Timestamp) {
        return date;
    }

    if (date instanceof Date) {
        return Timestamp.fromDate(date);
    }

    return new Timestamp((date as any).seconds, (date as any).nanoseconds);
}
