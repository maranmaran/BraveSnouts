import { storage } from "../base-setup";


(async () => {
    console.log('adoption')
    await storage.bucket().deleteFiles({ prefix: 'adoption' });
    console.log('shop')
    await storage.bucket().deleteFiles({ prefix: 'shop' });
    console.log('blog')
    await storage.bucket().deleteFiles({ prefix: 'blog' });
    console.log('auction-items')
    await storage.bucket().deleteFiles({ prefix: 'delete-storages' });
})();