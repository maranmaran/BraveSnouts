import { Component, OnInit } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-email-copy',
  template: `
    <div class="container" fxLayout="row" fxLayoutAlign="center center">
            <div class="section" id="email_clipboard">
                app.hrabrenjuske@gmail.com
            </div>
            
            <button id="clipboard-btn" matTooltip="Kopiraj" [cdkCopyToClipboard]="value" class="pointer mat-elevation-z2" (cdkCopyToClipboardCopied)="onCopyFinished($event)">
                <mat-icon>
                    content_copy
                </mat-icon>
            </button>
        </div>
  `,
  styles: [`
      #email_clipboard {
          padding: 0.25rem 0.5rem;
          height: calc(33.2px - 0.5rem);
          border-bottom-right-radius: 0;
          border-top-right-radius: 0;
      }
                  
      #clipboard-btn {
          border: unset;
          height: 33.2px;
          width: 40px;
          position: relative;
      }
    `]
})
export class EmailCopyComponent implements OnInit {

  constructor(
    private readonly toastSvc: HotToastService
  ) { }

  value = `app.hrabrenjuske@gmail.com`;

  ngOnInit() {
  }

  onCopyFinished(success) {
    if (success) {
      this.toastSvc.success("Email je kopiran", {
        dismissible: true,
        position: 'bottom-center',
      })
    } else {
      this.toastSvc.success("Email se nije uspio kopirati", {
        dismissible: true,
        position: 'bottom-center'
      })
    }
  }

}