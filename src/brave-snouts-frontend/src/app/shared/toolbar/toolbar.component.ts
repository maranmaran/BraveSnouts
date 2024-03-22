import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { Router, RouterModule } from '@angular/router'
import { noop } from 'rxjs'
import { AuthService } from 'src/business/services/auth.service'
import { BreakpointService } from 'src/business/services/breakpoint.service'
import { ProgressBarService } from 'src/business/services/progress-bar.service'
import { SupportComponent } from '../support/support.component'

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatToolbarModule,
        MatTabsModule,
        MatButtonModule,
        MatMenuModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatIconModule,
    ],
    styles: [
        `
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
        <mat-toolbar class="h-10 flex flex-row justify-between" color="primary">
            <div id="actions" class="flex flex-row w-auto">
                <button class="hidden lg:flex" mat-icon-button [matMenuTriggerFor]="navMenu">
                    <mat-icon>menu</mat-icon>
                </button>
                <mat-menu #navMenu="matMenu">
                    <ng-container *ngTemplateOutlet="navBtn; context: { route: '/', name: 'Početna' }" ></ng-container>
                     <ng-container *ngTemplateOutlet="navBtn; context: { route: '/blog', name: 'Blog' }" ></ng-container>
                    <ng-container *ngTemplateOutlet="navBtn; context: { route: '/merch', name: 'Merch' }" ></ng-container>
                    <ng-container *ngTemplateOutlet="navBtn; context: { route: '/udomi', name: 'Udomi' }" ></ng-container>
                    <ng-container *ngTemplateOutlet="navBtn; context: { route: '/aukcije', name: 'Aukcije' }" ></ng-container>
                </mat-menu>

                <span class="flex lg:hidden gap-4">
                    <ng-container *ngTemplateOutlet="navBtn; context: { route: '/', name: 'Početna' }" ></ng-container>
                    <ng-container *ngTemplateOutlet="navBtn; context: { route: '/blog', name: 'Blog' }" ></ng-container>
                    <ng-container *ngTemplateOutlet="navBtn; context: { route: '/merch', name: 'Merch' }" ></ng-container>
                    <ng-container *ngTemplateOutlet="navBtn; context: { route: '/udomi', name: 'Udomi' }" ></ng-container>
                    <ng-container *ngTemplateOutlet="navBtn; context: { route: '/aukcije', name: 'Aukcije' }" ></ng-container>
                </span>
            </div>

            <div
                id="logo"
                (click)="onLogoClick()"
                class="flex flex-row gap-4 justify-center items-center flex-auto logo-center z-50"
            >
                <div
                    #logo
                    class="logo elevate hover z-[100]"
                    [ngClass]="{ 'cursor-pointer': !rootRoute }"
                    [hidden]="clickFlag"
                >
                    <mat-progress-spinner *ngIf="loading$ | async" class="spinner" mode="indeterminate" color="accent">
                    </mat-progress-spinner>
                </div>

                <!--When we click, stick with animation a bit longer-->
                <div class="logo-animated" [hidden]="!clickFlag"></div>
            </div>

            <div id="user-profile" class="user-auth h-full relative flex flex-row justify-end items-center gap-2">
                <button mat-icon-button matTooltip="Pomoć" (click)="onShowContactHelp()">
                    <mat-icon>help</mat-icon>
                </button>

                <button *ngIf="!(user$ | async)" mat-stroked-button class="p-0" (click)="onLogin()">Prijava</button>

                <ng-container *ngIf="user$ | async as user">
                    <img
                        *ngIf="user?.photoURL; else noPhoto"
                        class="avatar cursor-pointer elevate hover default"
                        src="{{ user.photoURL }}"
                        matTooltip="{{ user.displayName }}"
                        [matMenuTriggerFor]="profileMenu"
                    />

                    <ng-template #noPhoto>
                        <img
                            id="anonymous"
                            matTooltip="{{ (userInfo$ | async)?.displayName }}"
                            class="avatar cursor-pointer elevate hover-large mat-elevation-z2"
                            src="assets/placeholders/anonymous.svg"
                            [matMenuTriggerFor]="profileMenu"
                        />
                    </ng-template>

                    <mat-menu #profileMenu="matMenu">
                        <button mat-menu-item (click)="onShowContactHelp()">
                            <mat-icon>help</mat-icon>
                            Pomoć
                        </button>
                        <button mat-menu-item (click)="onChangeEmail()">
                            <mat-icon>mail</mat-icon>
                            Promijeni e-mail
                        </button>
                        <button mat-menu-item [routerLink]="['email-postavke']">
                            <mat-icon>notifications_active</mat-icon>
                            Postavke notifikacija
                        </button>
                        <button mat-menu-item (click)="onLogout()">
                            <mat-icon matPrefix> exit_to_app </mat-icon>
                            Odjava
                        </button>
                    </mat-menu>
                </ng-container>
            </div>
        </mat-toolbar>

        <ng-template #navBtn let-route="route" let-name="name">
            <button
                mat-button
                class="nav-button shadow-md hover:shadow-xl"
                [routerLink]="[route]"
                [routerLinkActiveOptions]="{ exact: true }"
                routerLinkActive="nav-button-active"
            >
                {{ name }}
            </button>
        </ng-template>
    `,
})
export class ToolbarComponent {
    readonly router = inject(Router);
    readonly dialog = inject(MatDialog);
    readonly authSvc = inject(AuthService);
    readonly loadingSvc = inject(ProgressBarService);
    readonly breakpointSvc = inject(BreakpointService);

    readonly loading$ = this.loadingSvc.loading$

    readonly user$ = this.authSvc.user$
    readonly userInfo$ = this.authSvc.getUserInformation()

    clickFlag = false
    onLogoHover(mouseEnter) {
        if (this.rootRoute) return

        this.clickFlag = mouseEnter
    }

    onLogoClick() {
        if (this.rootRoute) return

        this.clickFlag = true

        this.router.navigate(['/aukcije']).then(_ => setTimeout(_ => (this.clickFlag = false), 1000))
    }

    get rootRoute() {
        return this.router.url === '/'
    }

    onShowContactHelp() {
        this.dialog.open(SupportComponent, {
            height: 'auto',
            width: '98%',
            maxWidth: '23rem',
            autoFocus: false,
            closeOnNavigation: true,
            panelClass: 'dialog-no-padding',
        })
    }

    onLogout = () => this.authSvc.logout()
    onLogin = () => this.authSvc.login().subscribe(noop)
    onChangeEmail = () => this.authSvc.openChangeEmailDialog(null)
}
