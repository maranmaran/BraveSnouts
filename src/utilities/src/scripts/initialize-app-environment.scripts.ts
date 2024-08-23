import { store } from "../base-setup";

(async () => {
    await initializeFirestore('brave-snouts-dev');
})();

const initializeStorage = async (projectName) => {
    // Auction images and other blobs
    // /auction-items/*

    // Logos and such
    // /logos/bank-accounts
    // /logos/snouts

    // I don't think this is used anymore, we only pull mail templates from deliverables with functions
    // local ones, however, this was once used so we can configure it on the fly without deployment

    // /mail-templates/*

    // used for exports
    // /temp/

}

const initializeFirestore = async (projectName) => {

    // Admin approvals, ID must be real ID of registered user from firebase AUTH
    await store.collection('admins').doc('add-real-id').create({ name: 'Marko Urh' });

    // Configuration of bank accounts to show on dashboard of the application
    await store.collection('config').doc('bank-accounts')
        .create({
            erste: {
                account: 'HR9224020063209851271',
                image: `https://firebasestorage.googleapis.com/v0/b/${projectName}.appspot.com/o/logos%2Fbank-accounts%2Ferste.svg?alt=media`,
                name: 'Erste',
                type: 'erste',
                visible: false
            },
            keks: {
                account: '098787823',
                image: `https://firebasestorage.googleapis.com/v0/b/${projectName}.appspot.com/o/logos%2Fbank-accounts%2Fkeks-logo.jpg?alt=media`,
                name: 'Keks',
                type: 'keks',
                visible: false
            },
            paypal: {
                account: 'hrabre.njuske1@gmail.com',
                image: `https://firebasestorage.googleapis.com/v0/b/${projectName}.appspot.com/o/logos%2Fbank-accounts%paypal-logo.jpg?alt=media`,
                name: 'Paypal',
                type: 'paypal',
                visible: true
            },
            pbz: {
                account: 'HR4223400091110951628',
                image: `https://firebasestorage.googleapis.com/v0/b/${projectName}.appspot.com/o/logos%2Fbank-accounts%2Fpbz-logo.jpg?alt=media`,
                name: 'PBZ',
                type: 'pbz',
                visible: true
            },
            revolut: {
                account: '0994513163',
                image: `https://firebasestorage.googleapis.com/v0/b/${projectName}.appspot.com/o/logos%2Fbank-accounts%2Frevolut-logo.jpg?alt=media`,
                name: 'Revolut',
                type: 'revolut',
                visible: true
            }
        });

    // Some global application settings
    await store.collection('config').doc('global')
        .create({
            // This is to be used eventually with "kill-switch"
            // This budget should match max threshold in terms of dollars ($)
            // Once alert that overshoots this threshold comes in the kill switch
            // Should shut down services and disable billing
            budget: 0.5,
            // False, if we just wish to use the compressed images
            //
            // True, if we wish to gradually load images
            // This means that images with low/medium res will be shown first and highest resolution
            // Images are put on top of them, since they take longer to load and download
            // They will gradually load over the low resolution ones
            // 
            // Developer note: !!
            // Turning this to TRUE increases costs because of our
            // storage bandwith increase (more high res images more download egress more money spent)
            gradualImageLoading: false,

            // False, if we do not wish to override all images to use full resolution (original upload)
            // True, if we wish to override all images to use full resolution (original upload)
            loadFullResolution: false,
            // Parameters used when invoking "test" mail from the application
            testing: {
                email: 'test@gmail.com',
                itemsCount: '10'
            }
        });

    // Used to configure how we process images
    await store.collection('config').doc('image-processing')
        .create({
            compress: true,
            compressExtension: 'jpg',
            compressMethod: 'JPEG',
            compressQuality: 50,
            compressResizeHeight: 500,
            compressResizeWidth: 500
        });

    // Mail variables used in MJML templates
    await store.collection('config').doc('mail-variables')
        .create({
            // Shows bank accounts to be shown to users in mail templates
            bank_accounts: {
                show: true,
                message:
                    `<ul> 
                        <li>IBAN - HR4223400091110951628</li>      
                        <li>Paypal - hrabre.njuske1@gmail.com</li>   
                        <li>Revolut - 0994513163</li> 
                    </ul>`
            },
            // Custom message about postage (alert or warning)
            postage_remark: {
                show: false,
                message:
                    `<b>Napomena:</b>
                     <div style="margin-top: 10px">
                        Kako bismo pakete mogli poslati prije blagdana molimo Vas da uplatu izvršite najkasnije do srijede, 31.03.
                    </div>`
            },
            // Explains postage calculation rules
            // This uses postage-calculation/rules collection in config
            postage_rules: {
                show: true,
                message:
                    `<div class="mt-3 bold">
                        <ul>
                            <li>1 knjiga - 3€ poštarina</li>
                            <li>2-5 knjiga - 4€ poštarina</li>
                            <li>5-10 knjiga - 5€ poštarina</li>
                            <li>10+ knjiga - 6€ poštarina</li>
                        </ul>
                    </div>`
            },
        });

    // Postage caculation rules
    // Goes like: From X to the next rule or infinity
    // Has lower bound and postage in €
    // From-0
    // From 5
    // Means: 0-5, 5-infinity
    await store.collection('config').doc('postage-calculation')
        .collection('rules')
        .doc('from-0').create({ lower: 0, postage: 3 });



}