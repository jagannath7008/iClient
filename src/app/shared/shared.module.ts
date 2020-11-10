import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IautocompleteComponent } from "./iautocomplete/iautocomplete.component";
import { DynamicGridComponent } from "./dynamic-grid/dynamic-grid.component";
import { BhTimepickerComponent } from "./bh-timepicker/bh-timepicker.component";
import { PageBreadCrumComponent } from "./page-bread-crum/page-bread-crum.component";
import { NoitempageComponent } from "./noitempage/noitempage.component";
import { DefaultValue } from "src/providers/filters/default";

@NgModule({
  declarations: [
    IautocompleteComponent,
    DynamicGridComponent,
    BhTimepickerComponent,
    PageBreadCrumComponent,
    NoitempageComponent,
    DefaultValue
  ],
  imports: [CommonModule],
  exports: [
    IautocompleteComponent,
    DynamicGridComponent,
    BhTimepickerComponent,
    PageBreadCrumComponent,
    NoitempageComponent,
  ],
})
export class SharedModule {}
