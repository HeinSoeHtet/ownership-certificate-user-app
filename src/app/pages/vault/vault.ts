import { Component } from '@angular/core';
import { Navbar } from '../../layouts/navbar/navbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-vault',
  imports: [MatCardModule, MatButtonModule, Navbar],
  templateUrl: './vault.html',
  styleUrl: './vault.css',
})
export class Vault {}
