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
                    <!-- <ng-container *ngTemplateOutlet="navBtn; context: { menu: true, icon: 'home', route: '/pocetna', name: 'Početna' }" ></ng-container> -->
                    <!-- <ng-container *ngTemplateOutlet="navBtn; context: { menu: true, icon: 'newspaper', route: '/blog', name: 'Blog' }" ></ng-container> -->
                    <!-- <ng-container *ngTemplateOutlet="navBtn; context: { menu: true, icon: 'storefront', route: '/merch', name: 'Merch' }" ></ng-container> -->
                    <ng-container *ngTemplateOutlet="navBtn; context: { menu: true, icon: 'pets', route: '/udomi', name: 'Udomi' }" ></ng-container>
                    <ng-container *ngTemplateOutlet="navBtn; context: { menu: true, icon: 'volunteer_activism', route: '/aukcije', name: 'Aukcije' }" ></ng-container>
                </mat-menu>
                <span class="flex lg:hidden gap-4">
                    <!-- <ng-container *ngTemplateOutlet="navBtn; context: { icon: 'home', route: '/pocetna', name: 'Početna' }" ></ng-container> -->
                    <!-- <ng-container *ngTemplateOutlet="navBtn; context: { icon: 'newspaper', route: '/blog', name: 'Blog' }" ></ng-container> -->
                    <!-- <ng-container *ngTemplateOutlet="navBtn; context: { icon: 'storefront', route: '/merch', name: 'Merch' }" ></ng-container> -->
                    <ng-container *ngTemplateOutlet="navBtn; context: { icon: 'pets', route: '/udomi', name: 'Udomi' }" ></ng-container>
                    <ng-container *ngTemplateOutlet="navBtn; context: { icon: 'volunteer_activism', route: '/aukcije', name: 'Aukcije' }" ></ng-container>
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

                <button mat-icon-button *ngIf="admin$ | async; info" matTooltip="Administracija" [matMenuTriggerFor]="adminMenu">
                    <mat-icon>admin_panel_settings</mat-icon>
                </button>
                <mat-menu #adminMenu="matMenu">
                    <button mat-menu-item (click)="onCreateAuctionThroughImages()">
                        <mat-icon matPrefix> add </mat-icon>
                        <span class="mat-small">Napravi aukciju</span>
                    </button>
                    <button mat-menu-item routerLink="/aukcije/administracija">
                        <mat-icon matPrefix> admin_panel_settings </mat-icon>
                        <span class="mat-small">Admin sučelje</span>
                    </button>
                    <button mat-menu-item routerLink="/blog">
                        <mat-icon matPrefix> storefront </mat-icon>
                        <span class="mat-small">Blog (vNext)</span>
                    </button>
                    <button mat-menu-item routerLink="/merch">
                        <mat-icon matPrefix> newspaper </mat-icon>
                        <span class="mat-small">Shop (vNext)</span>
                    </button>
                </mat-menu>
                
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

        <ng-template #navBtn let-route="route" let-icon="icon" let-name="name" let-menu="menu">
            <button *ngIf="!menu"
                mat-button
                class="nav-button shadow-md hover:shadow-xl"
                [routerLink]="[route]"
                [routerLinkActiveOptions]="{
                    paths: 'subset',
                    fragment: 'exact',
                    matrixParams: 'exact',
                    queryParams: 'exact'
                }"
                routerLinkActive="mat-mdc-button mat-mdc-raised-button"
            >
                <mat-icon matPrefix>{{icon}}</mat-icon>
                {{ name }}
            </button>
            <button *ngIf="menu"
                mat-menu-item
                [routerLink]="[route]"
                [routerLinkActiveOptions]="{
                    paths: 'subset',
                    fragment: 'exact',
                    matrixParams: 'exact',
                    queryParams: 'exact'
                }"
                routerLinkActive="bg-zinc-200"
            >
                <mat-icon matPrefix>{{icon}}</mat-icon>
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
    readonly admin$ = this.authSvc.isAdmin$;
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


    onCreateAuctionThroughImages() {
        this.router.navigate(['/aukcije/kreiranje-aukcije-sa-ucitavanjem-slika']);
    }

    onLogout = () => this.authSvc.logout()
    onLogin = () => this.authSvc.login().subscribe(noop)
    onChangeEmail = () => this.authSvc.openChangeEmailDialog(null)
}
