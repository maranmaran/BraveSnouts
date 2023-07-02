import { Component } from '@angular/core';

@Component({
  selector: 'app-maintenance',
  template: `
    <div class="h-full flex flex-col justify-center items-center gap-4">
    <div #logo class="logo elevate hover" style="height: 200px; width: 200px"></div>

    <div class="mat-h1-4 mt-5 text-center">Spremamo velike stvari !</div>
    </div>
  `
})
export class MaintenanceComponent { }
