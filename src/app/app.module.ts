import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSliderModule } from '@angular/material/slider'; 
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CanvasModule } from './canvas/canvas.module';
import { MatTabsModule } from '@angular/material/tabs'; 

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatSliderModule,
    MatTabsModule,
    CanvasModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
