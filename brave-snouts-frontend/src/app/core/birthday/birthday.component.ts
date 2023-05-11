import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { HotToastService } from '@ngneat/hot-toast';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-birthday',
  templateUrl: './birthday.component.html',
  styleUrls: [
    './birthday.component.scss',
    './../../shared/toolbar/toolbar.component.scss',
  ]
})
export class BirthdayComponent implements OnInit {

  constructor(
    private readonly toastSvc: HotToastService,
    private readonly renderer: Renderer2,
    private elementRef: ElementRef,
    private readonly metaSvc: Meta,
    private readonly titleSvc: Title,
  ) { }

  ngOnInit() {
    this.titleSvc.setTitle('Proslava rođendana');

    this.metaSvc.updateTag({ name: 'author', content: 'Hrabre Njuške' });
    this.metaSvc.updateTag({ name: 'keywords', content: 'proslava, rođendan, hrabre, njuške' });
    this.metaSvc.updateTag({ name: 'description', content: 'Proslava 5. rođendana hrabrih njuški!' });
    this.metaSvc.updateTag({ name: 'og:title', content: 'Proslava rođendana' });
    this.metaSvc.updateTag({ name: 'og:description', content: 'Proslava 5. rođendana hrabrih njuški!' });

    setTimeout(() => this.surprise(), 500);
  }

  surprise(): void {
    const canvas = this.renderer.createElement('canvas');
    this.renderer.appendChild(this.elementRef.nativeElement, canvas);

    confetti({
      particleCount: 350,
      spread: 180
    });

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
