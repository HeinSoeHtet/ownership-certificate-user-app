import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Navbar } from '../../layouts/navbar/navbar';

@Component({
  selector: 'app-verify',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    Navbar,
  ],
  templateUrl: './verify.html',
  styleUrl: './verify.css',
})
export class Verify {}
