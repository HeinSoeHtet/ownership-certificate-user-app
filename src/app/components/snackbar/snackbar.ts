import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-snackbar',
  imports: [MatSnackBarModule],
  templateUrl: './snackbar.html',
  styleUrl: './snackbar.css',
})
export class Snackbar {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {}
}
