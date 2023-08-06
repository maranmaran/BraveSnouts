import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { RouterModule } from "@angular/router";

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [MatButtonModule, RouterModule],
    styles: [``],
    template: `
        <div class="flex flex-wrap justify-center gap-4 items-center">
            <button mat-raised-button [routerLink]="['']" routerLinkActive="router-link-active">Početna</button> 
            <button mat-raised-button [routerLink]="['/blog']" routerLinkActive="router-link-active">Blog</button> 
            <button mat-raised-button [routerLink]="['/merch']" routerLinkActive="router-link-active">Merch</button> 
            <button mat-raised-button [routerLink]="['/udomi']" routerLinkActive="router-link-active">Udomi</button> 
            <button mat-raised-button [routerLink]="['/aukcije']" routerLinkActive="router-link-active">Aukcije</button> 
        </div>    
    `,
})
export class ToolbarComponent {

}