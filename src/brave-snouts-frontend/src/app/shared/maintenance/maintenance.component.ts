import { Component } from '@angular/core';

@Component({
  selector: 'app-maintenance',
  template: `
    <div class="h-full flex flex-col justify-center items-center gap-4">
    <div #logo class="logo elevate hover h-[200px] w-[200px]"></div>

    <div class="text-2xl-4 mt-5 text-center">Spremamo velike stvari !</div>
    </div>
  `,
  standalone: true,
  imports: []
})
export class MaintenanceComponent { }
