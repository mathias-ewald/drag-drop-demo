import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasComponent } from './canvas/canvas.component';
import { DragDropModule } from '@angular/cdk/drag-drop';



@NgModule({
  declarations: [
    CanvasComponent
  ],
  imports: [
    CommonModule,
    DragDropModule
  ],
  exports: [
    CanvasComponent
  ]
})
export class CanvasModule { }
