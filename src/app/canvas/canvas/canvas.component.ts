import { CdkDragEnd, CdkDragMove, DragRef, Point } from '@angular/cdk/drag-drop';
import { AfterContentInit, AfterViewChecked, AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';

export interface Box {
    name: string;                 // Name of the box, can be used to render a label in the UI template
    
    movable: boolean;             // Whether the position can be changed
    posX: number;                 // Position of the box in percent, -1 = left, 0 = center, 1 = right
    posY: number;                 // Position of the box in percent, -1 = top, 0 = center, 1 = bottom

    scalable: boolean;            // Whether the size can be changed
    scaleX: number;               // Scale factor to apply to the box on the x axis
    scaleY: number;               // Scale factor to apply to the box on the y axis
    
    croppable: boolean;           // Whether the box can be croped
    cropTop: number;              // Percent (after scale) to crop off of the box from the top, 0 = no crop
    cropRight: number;            // Percent (after scale) to crop off of the box from the right, 0 = no crop
    cropBottom: number;           // Percent (after scale) to crop off of the box from the bottom, 0 = no crop
    cropLeft: number;             // Percent (after scale) to crop off of the box from the left, 0 = no crop

    selected: boolean;            // Whether the box is currently selected
    hide: boolean;                // Whether the box should be rendered
    background: boolean;          // Render the box on the background or foreground layer?
    template?: TemplateRef<any>;  // The template to use to render the box
    color?: string;               // The color to use if no template is configured
    data?: any;                   // Any data attached to the box
}

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit, AfterViewInit, AfterViewChecked, OnChanges, AfterContentInit {

  @Output()
  public change: EventEmitter<Box> = new EventEmitter();

  @Input()
  public edit: boolean = true;

  @Input()
  public templates: boolean = true;

  @Input()
  public grid: boolean = true;

  @Input()
  public boxes?: Box[];


  /**
   * We need to know about the canvas' dimensions in order to 
   * properly calculate element positions and dimentions later
   */
  private canvas?: ElementRef;
  public posX = 0;
  public posY = 0;
  public width = 0;
  public height = 0;


  constructor(private elRef:ElementRef) {
    this.canvas = elRef;
  }


  // Deselect all boxes when the user presses escape
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    this.deselectAll();
  } 

  // Accessor for the tempalte to get all boxes to be rendered in the background (behind the grid)
  get backgroundBoxes(): Box[] {
    return this.boxes?.filter(b => b.background === true) || [];
  }

  // Accessor for the tempalte to get all boxes to be rendered in the foreground (in front of the grid)
  get foregroundBoxes(): Box[] {
    return this.boxes?.filter(b => b.background === false) || [];
  }

  // Check if anything abou the box is editable
  editable(box: Box) {
    return box.movable || box.scalable || box.croppable;
  }


  /**
   * This is just a desparate attempt to fix the issues I am seeing
   */

  ngAfterContentInit(): void {
    this.updateCanvasInfo();
  }

  ngAfterViewInit(): void {
    this.updateCanvasInfo();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateCanvasInfo();
  }

  ngAfterViewChecked() {
    // this.updateCanvasInfo();
  }

  ngOnInit(): void {
    this.updateCanvasInfo();
  }

  public scaleX(box: Box): number {
    return 1;
  }

  public scaleY(box: Box): number {
    return 0.5;
  }

  /**
   * Listen to window resize events in order to trigger an update for
   * canvas dimentions.
   */
  @HostListener('window:resize', ['$event'])
  private onResize(event: any) {
    this.updateCanvasInfo();
  }

  /**
   * Update the canvas dimentions and trigger an update for handles as
   * they might have to be repositioned.
   */
  private updateCanvasInfo(): void {
    // Without the timeout, there will be errors in the console about values 
    // changing after being checked.
    setTimeout(() => {
      if (this.canvas == null) return;
      this.posX = this.canvas.nativeElement.getBoundingClientRect().left;
      this.posY = this.canvas.nativeElement.getBoundingClientRect().top;
      this.width = this.canvas.nativeElement.clientWidth;
      this.height = this.canvas.nativeElement.clientHeight;
    });
  }


  /**
   * We need to keep track of the currently selected box as handles will
   * need to be positioned in alignment with that box. A setter method 
   * allows to hook into changes and trigger the handle update
   */

  public select(box: Box | undefined) {
    if (box == null || this.edit === false) return;
    this.deselectAll();
    box.selected = true;
  } 

  /**
   * Called when the user selects a box with a click
   * @param event The mouse event that triggers the selection
   * @param box The box that was selected by that click
   */
  public boxClicked(event: MouseEvent, box: Box) {
    event.stopPropagation();
    this.select(box);
  }

  /**
   * Called when the user clicks an empty location on the canvas. Any
   * selected box is deselected and an update to the handles is triggered
   * which causes them to be hidden.
   */
  public deselect(box: Box) { 
    box.selected = false;
  }

  public deselectAll() { 
    (this.boxes || []).forEach(b => this.deselect(b));
  }

  /**
   * The following functions are used in the template which binds box styles to them in
   * order to position the box correctly.
   */

  calcBoxTop(box: Box): number    { return this.height / 2 + this.height / 2 * box.posY - this.calcBoxHeight(box) / 2; }
  calcBoxLeft(box: Box): number   { return this.width / 2 + this.width / 2 * box.posX - this.calcBoxWidth(box) / 2; }

  calcBoxWidth(box: Box): number  { return this.width * box.scaleX; }
  calcBoxHeight(box: Box): number { return this.height * box.scaleY; }

  calcBoxClipTop(box: Box): number    { return this.calcBoxHeight(box) * box.cropTop; }
  calcBoxClipRight(box: Box): number  { return this.calcBoxWidth(box) * box.cropRight; }
  calcBoxClipBottom(box: Box): number { return this.calcBoxHeight(box) * box.cropBottom; }
  calcBoxClipLeft(box: Box): number   { return this.calcBoxWidth(box) * box.cropLeft; }

  calcBoxClipPath(box: Box) { 
    const top = this.calcBoxClipTop(box);
    const right = this.calcBoxClipRight(box);
    const bottom = this.calcBoxClipBottom(box);
    const left = this.calcBoxClipLeft(box);
    return `inset(${top}px ${right}px ${bottom}px ${left}px)`;
  }

  calcBoxZIndex(box: Box) {
    if (box.selected === true) return 99999;
    return 100 + (this.boxes?.indexOf(box) || 0);
  }

  /**
   * NOT CURRENTLY USED. IGNORE
   */
  calcContentTransform(box: Box) {
    const targetRatio = 16/9;

    const height = this.calcBoxHeight(box);
    const width = this.calcBoxWidth(box);

    const actualRatio = width / height;

    let sX = 1;
    let sY = 1;

    if (actualRatio < targetRatio) {
      const currentHeight = width / 16 * 9;
      sY = height / currentHeight;
    } else if (actualRatio > targetRatio) {
      const currentHeight = width / 16 * 9;
      sY = height / currentHeight;
    }
    
    return `scale(1, 0.5)`;
  }

  /*
   * Drag & Drop Handlers 
   */

  /**
   * This method is called when the user releases the box during a drag & drop movement
   * of the box itself. This should cause the box to change position.
   * @param event 
   * @param box 
   */
  public boxReleased(event: CdkDragEnd, box: Box) {
    // Calculate the new box positions and set them in the box
    const dX = event.distance.x / (this.width / 2);
    const dY = event.distance.y / (this.height / 2);
    box.posX += dX;
    box.posY += dY;

    // CDK Drag Drop uses style.transform = translate() to reposition elements when 
    // they are dragged. We need to remove that transformation since we updated the 
    // Box position itself which will cause the Box to reposition.
    event.source._dragRef.reset();

    this.change.emit(box);
  }

  // Cropping

  cropTopHandleEnd(event: CdkDragEnd) {
    const box: Box = event.source.data;
    const scaled_dist = event.distance.y;
    const diff = scaled_dist / this.calcBoxHeight(box);
    box.cropTop = Math.min(1, Math.max(0, box.cropTop + diff));
    event.source._dragRef.reset();
    this.change.emit(box);
  }

  cropRightHandleEnd(event: CdkDragEnd) {
    const box: Box = event.source.data;
    const scaled_dist = event.distance.x * -1;
    const diff = scaled_dist / this.calcBoxWidth(box);
    box.cropRight = Math.min(1, Math.max(0, box.cropRight + diff));
    event.source._dragRef.reset();
    this.change.emit(box);
  }

  cropBottomHandleEnd(event: CdkDragEnd) {
    const box: Box = event.source.data;
    const scaled_dist = event.distance.y * -1;
    const diff = scaled_dist / this.calcBoxHeight(box);
    box.cropBottom = Math.min(1, Math.max(0, box.cropBottom + diff));
    event.source._dragRef.reset();
    this.change.emit(box);
  }

  cropLeftHandleEnd(event: CdkDragEnd) {
    const box: Box = event.source.data;
    const scaled_dist = event.distance.x;
    const diff = scaled_dist / this.calcBoxWidth(box);
    box.cropLeft = Math.min(1, Math.max(0, box.cropLeft + diff));
    event.source._dragRef.reset();
    this.change.emit(box);
  }

  // Scaling
  public scaleNWSE(event: CdkDragEnd) {
    const box: Box = event.source.data;
    const origin: Point = { x: this.calcBoxLeft(box) + this.calcBoxClipLeft(box), y: this.calcBoxTop(box) + this.calcBoxClipTop(box) };

    const dropPoint: Point = { x: event.dropPoint.x - this.posX, y: event.dropPoint.y - this.posY};
    const center: Point = {  x: this.calcBoxLeft(box) + this.calcBoxWidth(box) / 2, y: this.calcBoxTop(box) + this.calcBoxHeight(box) / 2 };
    const dragVector: Point = {  x: center.x - origin.x, y: center.y - origin.y };
    const dragVectorSlope = dragVector.y / dragVector.x;
    const dragPathIntercept = origin.y - dragVectorSlope * origin.x;
    const projectedPoint: Point = this.project(dropPoint, dragVectorSlope, dragPathIntercept);

    box.scaleX = (projectedPoint.x - this.width * (1/2 + box.posX)) / (this.width * (box.cropLeft - 1/2));
    box.scaleY = (projectedPoint.y - this.height * (1/2 + box.posY)) / (this.height * (box.cropTop - 1/2));

    event.source._dragRef.reset();
    this.change.emit(box);
  }

  public scaleNESW(event: CdkDragEnd) {
    const box: Box = event.source.data;
    const origin: Point = { x: this.calcBoxLeft(box) + this.calcBoxWidth(box) - this.calcBoxClipRight(box), y: this.calcBoxTop(box) + this.calcBoxClipTop(box) };

    const dropPoint: Point = { x: event.dropPoint.x - this.posX, y: event.dropPoint.y - this.posY};
    const center: Point = {  x: this.calcBoxLeft(box) + this.calcBoxWidth(box) / 2, y: this.calcBoxTop(box) + this.calcBoxHeight(box) / 2 };
    const dragVector: Point = {  x: center.x - origin.x, y: center.y - origin.y };
    const dragVectorSlope = dragVector.y / dragVector.x;
    const dragPathIntercept = origin.y - dragVectorSlope * origin.x;
    const projectedPoint: Point = this.project(dropPoint, dragVectorSlope, dragPathIntercept);

    box.scaleX = (projectedPoint.x - this.width / 2 - this.width / 2 * box.posX) / (this.width / 2 - this.width * box.cropRight);
    box.scaleY = (projectedPoint.y - this.height / 2 - this.height / 2 * box.posY) / (-1 * this.height / 2 + this.height * box.cropTop);
    
    event.source._dragRef.reset();
    this.change.emit(box);
  }

  public scaleSENW(event: CdkDragEnd) {
    const box: Box = event.source.data;
    const origin: Point = { x: this.calcBoxLeft(box) + this.calcBoxWidth(box) - this.calcBoxClipRight(box), y: this.calcBoxTop(box) + this.calcBoxHeight(box) - this.calcBoxClipBottom(box) };

    const dropPoint: Point = { x: event.dropPoint.x - this.posX, y: event.dropPoint.y - this.posY};
    const center: Point = {  x: this.calcBoxLeft(box) + this.calcBoxWidth(box) / 2, y: this.calcBoxTop(box) + this.calcBoxHeight(box) / 2 };
    const dragVector: Point = {  x: center.x - origin.x, y: center.y - origin.y };
    const dragVectorSlope = dragVector.y / dragVector.x;
    const dragPathIntercept = origin.y - dragVectorSlope * origin.x;
    const projectedPoint: Point = this.project(dropPoint, dragVectorSlope, dragPathIntercept);

    box.scaleX = (projectedPoint.x - this.width / 2 - this.width / 2 * box.posX) / (this.width / 2 - this.width * box.cropRight);
    box.scaleY = (projectedPoint.y - this.height / 2 - this.height / 2 * box.posY) / (this.height / 2 - this.height * box.cropBottom);
    
    event.source._dragRef.reset();
    this.change.emit(box);
  }

  public scaleSWNE(event: CdkDragEnd) {
    const box: Box = event.source.data;
    const origin: Point = { x: this.calcBoxLeft(box) + this.calcBoxClipLeft(box), y: this.calcBoxTop(box) + this.calcBoxHeight(box) - this.calcBoxClipBottom(box) };

    const dropPoint: Point = { x: event.dropPoint.x - this.posX, y: event.dropPoint.y - this.posY};
    const center: Point = {  x: this.calcBoxLeft(box) + this.calcBoxWidth(box) / 2, y: this.calcBoxTop(box) + this.calcBoxHeight(box) / 2 };
    const dragVector: Point = {  x: center.x - origin.x, y: center.y - origin.y };
    const dragVectorSlope = dragVector.y / dragVector.x;
    const dragPathIntercept = origin.y - dragVectorSlope * origin.x;
    const projectedPoint: Point = this.project(dropPoint, dragVectorSlope, dragPathIntercept);

    box.scaleX = (projectedPoint.x - this.width / 2 - this.width / 2 * box.posX) / (-1 * this.width / 2 + this.width * box.cropLeft);
    box.scaleY = (projectedPoint.y - this.height / 2 - this.height / 2 * box.posY) / (this.height / 2 - this.height * box.cropBottom);

    event.source._dragRef.reset();
    this.change.emit(box);
  }


  constrainNWSE(userPointerPosition: Point, dragRef: DragRef, dimensions: ClientRect, pickupPositionInElement: Point) {
    const box: Box = dragRef.data.data;
    const origin: Point = { x: this.calcBoxLeft(box) + this.calcBoxClipLeft(box), y: this.calcBoxTop(box) + this.calcBoxClipTop(box) };
    const compensation: Point = { x: 0, y: 0 };
    return this.constrain(origin, compensation, userPointerPosition, dragRef, dimensions, pickupPositionInElement);
  }

  constrainNESW(userPointerPosition: Point, dragRef: DragRef, dimensions: ClientRect, pickupPositionInElement: Point) {
    const box: Box = dragRef.data.data;
    const origin: Point = { x: this.calcBoxLeft(box) + this.calcBoxWidth(box) - this.calcBoxClipRight(box), y: this.calcBoxTop(box) + this.calcBoxClipTop(box) };
    const compensation: Point = { x: -dimensions.width, y: 0 };
    return this.constrain(origin, compensation, userPointerPosition, dragRef, dimensions, pickupPositionInElement);
  }

  constrainSWNE(userPointerPosition: Point, dragRef: DragRef, dimensions: ClientRect, pickupPositionInElement: Point) {
    const box: Box = dragRef.data.data;
    const origin: Point = { x: this.calcBoxLeft(box) + this.calcBoxClipLeft(box), y: this.calcBoxTop(box) + this.calcBoxHeight(box) - this.calcBoxClipBottom(box) };
    const compensation: Point = { x: 0, y: -dimensions.height };
    return this.constrain(origin, compensation, userPointerPosition, dragRef, dimensions, pickupPositionInElement);
  }

  constrainSENW(userPointerPosition: Point, dragRef: DragRef, dimensions: ClientRect, pickupPositionInElement: Point) {
    const box: Box = dragRef.data.data;
    const origin: Point = { x: this.calcBoxLeft(box) + this.calcBoxWidth(box) - this.calcBoxClipRight(box), y: this.calcBoxTop(box) + this.calcBoxHeight(box) - this.calcBoxClipBottom(box) };
    const compensation: Point = { x: -dimensions.width, y: -dimensions.height };
    return this.constrain(origin, compensation, userPointerPosition, dragRef, dimensions, pickupPositionInElement);
  }

  private constrain(origin: Point, compensation: Point, userPointerPosition: Point, dragRef: DragRef, dimensions: ClientRect, pickupPositionInElement: Point): Point {
    const box: Box = dragRef.data.data;
    const center: Point = {  x: this.calcBoxLeft(box) + this.calcBoxWidth(box) / 2, y: this.calcBoxTop(box) + this.calcBoxHeight(box) / 2 };

    const dragVector: Point = { x: center.x - origin.x, y: center.y - origin.y };
    const dragVectorSlope = dragVector.y / dragVector.x;
    const dragPathIntercept = origin.y - dragVectorSlope * origin.x;

    const userPosition: Point = { x: userPointerPosition.x - this.posX, y: userPointerPosition.y - this.posY };

    const result: Point = this.project(userPosition, dragVectorSlope, dragPathIntercept);
    result.x += this.posX + compensation.x;
    result.y += this.posY + compensation.y;

    return result;
  }

  /**
   * Projects a point onto a linear function
   * @param p The point to project
   * @param m The slope of the function
   * @param i The y-intercept of the function
   */
  private project(point: Point, slope: number, intercept: number): Point {
    const m = slope * -1; // orthogonal slope
    const i = point.y - m * point.x; // y-intercept to pass through p
    const f = (x: number) => m * x + i; // ortho. function through point
    const x_equal = (intercept - i) / (m - slope);
    const y_equal = f(x_equal);
    return { x: x_equal, y: y_equal };
  }

  /*
   * Some utility functions 
   */

  swallowEvent(event: MouseEvent) {
    event.stopPropagation();
  }

}
