import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CHART_DIRECTIVES } from 'angular2-highcharts/index';

import { SharedModule } from '../shared/shared.module';
import { StockSearchComponent } from './stock-search.component';
import { PricerComponent } from './index';
import { PricerService } from './pricer.service';
import { Ng2CompleterModule } from 'ng2-completer';

@NgModule({
	imports: [CommonModule, SharedModule, Ng2CompleterModule],
	declarations: [StockSearchComponent, PricerComponent, CHART_DIRECTIVES],
	providers: [PricerService]
})
export class PricerModule {}
