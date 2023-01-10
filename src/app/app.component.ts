import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { tap } from 'rxjs';
import { Box } from './canvas/canvas/canvas.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

  tabIndex: number = 0; // Tab index to display

  boxes1?: Box[]; // Boxes for tab 1

  boxes2?: Box[]; // Boxes for tab 2
  
  // Template to use to render the boxes
  @ViewChild('boxTemplate')
  private boxTemplate?: TemplateRef<any>;


  constructor(private activatedRoute: ActivatedRoute, private router: Router) {}

  
  ngOnInit(): void {
    // Set the tabIndex variable from the query parameters
    this.activatedRoute.queryParams.pipe(
      tap(params => this.tabIndex = params['tab'] || 0)
    ).subscribe();
  }

  /**
   * When the user changes the tab, write that change into the URL
   * @param idx The active tab index
   */
  tabIndexChanged(idx: number) {
    const queryParams: Params = { tab: idx };
    this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: queryParams, queryParamsHandling: 'merge' });
  }

  /**
   * Initialize the boxes here, as we need access to the template
   * that comes in as an @ViewChild(). See above.
   */
  ngAfterViewInit(): void {
    // Avoid any errors with "Expression has changed after it was checked"
    setTimeout(() => {
      this.boxes1 = [{
        name: "Box1",
        movable: true,
        posX: 0, posY: 0,
        scalable: true,
        scaleX: 0.5, scaleY: 0.5,
        croppable: true,
        cropTop: 0, cropRight: 0, cropBottom: 0, cropLeft: 0,
        selected: false, hide: false,
        background: false,
        template: this.boxTemplate, color: "red",
        data: undefined,
      }];
  
      this.boxes2 = [{
        name: "Box",
        movable: true,
        posX: 0, posY: 0,
        scalable: true,
        scaleX: 0.5, scaleY: 0.5,
        croppable: true,
        cropTop: 0, cropRight: 0, cropBottom: 0, cropLeft: 0,
        selected: false, hide: false,
        background: false,
        template: this.boxTemplate, color: "orange",
        data: undefined,
      }];
    });
  }

}
