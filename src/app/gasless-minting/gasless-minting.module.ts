import { NgModule,InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GaslessMintingComponent } from './gasless-minting/gasless-minting.component';
import { GaslessMintingRoutingModule } from './gasless -minting-routing.module';
import { ButtonModule } from 'primeng/button';





@NgModule({
  declarations: [
    GaslessMintingComponent
  ],
  imports: [
    CommonModule,
    GaslessMintingRoutingModule,
    ButtonModule
  ],
  exports: [
    GaslessMintingComponent,
  ],
  providers:[]
})
export class GaslessMintingModule { }
