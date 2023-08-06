import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterModule } from "@angular/router";

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [MatButtonModule, RouterModule, MatToolbarModule],
    styles: [`
        :host { @apply block mb-4 p-2 }
    `],
    template: `
        <mat-toolbar class="grid grid-cols-5 justify-center items-center gap-4">
            <div class="cursor-pointer text-center rounded-md transition-all duration-150 p-4 shadow-sm hover:shadow-md" [routerLink]="['/']" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="!border-solid !border-0 !border-b !border-teal-400 shadow-lg">Početna</div> 
            <div class="cursor-pointer text-center rounded-md transition-all duration-150 p-4 shadow-sm hover:shadow-md" [routerLink]="['/blog']" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="!border-solid !border-0 !border-b !border-teal-400 !shadow-lg">Blog</div> 
            <div class="cursor-pointer text-center rounded-md transition-all duration-150 p-4 shadow-sm hover:shadow-md" [routerLink]="['/merch']" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="!border-solid !border-0 !border-b !border-teal-400 !shadow-lg">Merch</div> 
            <div class="cursor-pointer text-center rounded-md transition-all duration-150 p-4 shadow-sm hover:shadow-md" [routerLink]="['/udomi']" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="!border-solid !border-0 !border-b !border-teal-400 !shadow-lg">Udomi</div> 
            <div class="cursor-pointer text-center rounded-md transition-all duration-150 p-4 shadow-sm hover:shadow-md" [routerLink]="['/aukcije']" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="!border-solid !border-0 !border-b !border-teal-400 !shadow-lg">Aukcije</div> 
        </mat-toolbar>
    `,
})
export class ToolbarComponent {

}