import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
    name: 'auctionDate'
})
export class AuctionDatePipe implements PipeTransform {
    transform(value: Date, prepend: string = "", append: string = "") {

        let translatedDate = moment(value).locale("hr").format("dddd, DD.MM u HH:mm");

        let day: string, dateAndTimeStr: string;
        [day, dateAndTimeStr] = translatedDate.split(',');

        // Croatian shit
        // "Traje do" - OPTION1
            // ponedjeljka, utorka, srijede, četvrtka, petka, subote, nedjelje
        // "Završila u" || "Počinje u" - OPTION2
            // ponedjeljak, utorak, srijedu, četvrtak, petak, subotu, nedjelju

        let option1 = prepend == "Traje do";

        switch(day) {
            case "ponedjeljak":
                day = option1 ? "ponedjeljka" : "ponedjeljak";
                break;
            case "utorak":
                day = option1 ? "utorka" : "utorak";
                break;
            case "srijeda":
                day = option1 ? "srijede" : "srijedu";
                break;
            case "četvrtak":
                day = option1 ? "četvrtka" : "četvrtak";
                break;
            case "petak":
                day = option1 ? "petka" : "petak";
                break;
            case "subota":
                day = option1 ? "subote" : "subotu";
                break;
            case "nedjelja":
                day = option1 ? "nedjelje" : "nedjelju";
                break;
        }

        let message = `${prepend} ${day}, ${dateAndTimeStr}`
        return message;
    }
}


