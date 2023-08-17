import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatToolbarModule } from '@angular/material/toolbar'
import { RouterModule } from '@angular/router'

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [CommonModule, MatButtonModule, RouterModule, MatToolbarModule],
    styles: [
        `
            :host {
                @apply block mb-4;
            }

            .nav-button {
                @apply cursor-pointer text-center rounded-md transition-all duration-150 p-4 shadow-sm hover:shadow-md;
            }

            .nav-button-active {
                @apply !border-solid !border-0 !border-b !border-teal-400 !shadow-xl !opacity-80    
            }

            #anonymous {
                border-radius: 50%;
                height: 33px;
                padding: 5px;
            }

            .avatar {
                border-radius: 50%;
                height: 70%;
                width: auto;
            }

            .help-btn {
                font-size: 40px;
                height: 40px;
                width: 40px;
            }

            .logo-center {
                position: absolute;
                left: 50%;
                transform: translate(-50%, 0);
            }
        `,
    ],
    template: `
        <mat-toolbar color="primary" class="h-10 grid grid-cols-5 justify-center items-center gap-4">
            <ng-container *ngTemplateOutlet="navBtn; context: { route: '/', name: 'Početna' }" ></ng-container>
            <ng-container *ngTemplateOutlet="navBtn; context: { route: '/blog', name: 'Blog' }" ></ng-container>
            <ng-container *ngTemplateOutlet="navBtn; context: { route: '/merch', name: 'Merch' }" ></ng-container>
            <ng-container *ngTemplateOutlet="navBtn; context: { route: '/udomi', name: 'Udomi' }" ></ng-container>
            <ng-container *ngTemplateOutlet="navBtn; context: { route: '/aukcije', name: 'Aukcije' }" ></ng-container>
        </mat-toolbar>

        <ng-template #navBtn let-route="route" let-name="name">
            <button mat-raised-button color="primary"
                class="nav-button"
                [routerLink]="[ route ]"
                [routerLinkActiveOptions]="{ exact: true }"
                routerLinkActive="nav-button-active"
            > {{ name }} </button>
        </ng-template>
        
    `,
})
export class ToolbarComponent { }
