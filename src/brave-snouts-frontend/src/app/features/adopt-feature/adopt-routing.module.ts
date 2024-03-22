import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdoptHomeComponent } from './adopt-home.component';
import { AnimalComponent } from './animal.component';
import { AnimalsComponent } from './animals.component';

const routes: Routes = [
    {
        path: '', component: AdoptHomeComponent, children: [
            { path: '', component: AnimalsComponent },
            { path: 'njusku/:id', component: AnimalComponent, pathMatch: 'prefix' },
        ]
    },
    { path: '**', redirectTo: '/' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BlogRoutingModule { }
