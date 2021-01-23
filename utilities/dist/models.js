"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionItem = exports.Auction = void 0;
var Auction = /** @class */ (function () {
    function Auction(data) {
        Object.assign(this, data);
    }
    return Auction;
}());
exports.Auction = Auction;
var AuctionItem = /** @class */ (function () {
    function AuctionItem(data) {
        this.startBid = 0;
        this.bid = 0;
        Object.assign(this, data);
    }
    return AuctionItem;
}());
exports.AuctionItem = AuctionItem;
//# sourceMappingURL=models.js.map