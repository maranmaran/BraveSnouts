import { Component, inject } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { HotToastService } from "@ngxpert/hot-toast";
import { AdoptApi } from "./adopt.api";

@Component({
    selector: 'app-adopt-component',
    template: `
    `,
})
export class AdoptFormComponent {
    private readonly api = inject(AdoptApi);
    private readonly fb = inject(FormBuilder);
    private readonly toast = inject(HotToastService);

    readonly form = this.createForm()

    createForm() {
        return this.fb.group({
            fullName: this.fb.control('', Validators.required),
            phone: this.fb.control('', Validators.required),
            email: this.fb.control('', Validators.required)
        });
    }

    submit() {

    }

}