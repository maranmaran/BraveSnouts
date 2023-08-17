
import { bidChangeFn } from './functions/auctions/bid-change.function'
import { changeHandoverFn } from './functions/auctions/change-handover.function'
import { downloadMailsFn } from './functions/auctions/download-mails.function'
import { endAuctionFn } from './functions/auctions/end-auction.function'
import { exportAuctionFn } from './functions/auctions/export-auction.function'
import { handoverConfirmFn } from './functions/auctions/handover-confirm.function'
import { increaseRaisedMoneyFn } from './functions/auctions/increase-raised-money.function'
import { sendWinnerMailFn } from './functions/auctions/send-winner-mail.function'
import { testAuctionMailsFn } from './functions/auctions/test-auction-mails.function'

// Frequent
export const bidChange = bidChangeFn;
export const increaseRaisedMoney = increaseRaisedMoneyFn;

// Not frequent
export const endAuction = endAuctionFn;
export const changeHandover = changeHandoverFn;
export const exportAuction = exportAuctionFn;
export const handoverConfirm = handoverConfirmFn;
export const sendWinnerMail = sendWinnerMailFn;
export const downloadMails = downloadMailsFn;
export const testAuctionMails = testAuctionMailsFn;