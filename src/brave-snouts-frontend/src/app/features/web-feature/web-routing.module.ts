import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WebHomeComponent } from './web-home.component';

const routes: Routes = [
    { path: '', component: WebHomeComponent },
    { path: '**', redirectTo: '/' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WebRoutingModule { }
