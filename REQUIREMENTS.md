# Brave Snouts Requirements 

### Login
* Provide Instagram as login/registration option if possible
* Provide plain email/password authentication as login/registration option

### Bidding
* Remove `undo bid` as an option from the user interface.  
    * Users will have to contact support to resolve possible issues with their bidding

### Auction announcements

* Future auctions should be visible as `incoming˛` but not be open to users.  
  * Users will also be informed via Email about upcoming auctions ~3 days before and once the auction is open.  
  * Users should have an option to opt out of that mailing list.

* Users should be informed `24 hours` and `1 hour` before the end of an auction

### Auction end and purchase

At the end of auction users should be informed via email with data relating the auction and items they bought.  

Mail should include the following:
* Items
* Their winning bids
* Sum of the receipt
* Data for making payments
* Handover information
  * Handover information is variable and changes with each auction
  * Admins declare date and time of the `handover`
    * Because of this it's possibly a good idea not to automate closing of auctions via functions but by hand from admins where they can input handover details.
    * Also they could update handover details thus sending update mail to users
  * User should be able to confirm coming to handover by following link
* Postal delivery details
  * If users opt to using postal services and receiving their items
  * Users will have a deep link containing auctionId and other necessary data which will lead them to our application form where they can input their postal data. (address, full name, phone etc..)
  * Once this form is filled it will either
    * Automatically update user to have postal delivery as preferred choice and be visible in auction details to admins
    * Send email to admins about this user and his delivery choice, data and his items data
    * Both
* If a user chooses a hangover but then changes his mind and chooses postal he should just follow the link and it will update his preferred choice and vice versa. 
  
### Admin and users purchase tracking

Admins should have a list of winners and be able to mark which form of payment they made and whether or not they paid.

* Users should be marked as `pending payment` || `paid`
* Users should have markings on which option of delivery they have chosen
* If the option of delivery is postal services. Admins should be able to click on that and see postal data for that user

### Auction items layout (mobile devices)

Once a user navigates to auction on mobile devices he should just see auction details and remaining time with a grid of images below kind of like mobile image gallery style.

Once a user clicks on an image (auction item) it should open up a regular `auction-item-details.component` as it is currently implemented and seen in `card container` on web.


### Review and discuss more thoroughly 

* Should users be able to see `who` holds the bids
