import { Component } from '@angular/core';
import { Navbar } from '../../layouts/navbar/navbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-transfer',
  imports: [
    Navbar,
    MatButtonModule,
    MatFormField,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './transfer.html',
  styleUrl: './transfer.scss',
})
export class Transfer {}
