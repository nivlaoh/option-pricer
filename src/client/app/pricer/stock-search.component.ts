import { Component } from '@angular/core';
import { CompleterData, CompleterService } from 'ng2-completer';

@Component({
  moduleId: module.id,
  selector: 'stock-search',
  styleUrls: ['pricer.component.css'],
  template: `
            <ng2-completer [(ngModel)]="searchStr" [dataService]="dataService" [minSearchLength]="0" class="form-control">
            </ng2-completer>`,
})
export class StockSearchComponent {

  private searchStr: string;
  private dataService: CompleterData;
  private searchData = [
    { color: 'red', value: '#f00' },
    { color: 'green', value: '#0f0' },
    { color: 'blue', value: '#00f' },
    { color: 'cyan', value: '#0ff' },
    { color: 'magenta', value: '#f0f' },
    { color: 'yellow', value: '#ff0' },
    { color: 'black', value: '#000' }
  ];

  constructor(private completerService: CompleterService) {
    this.dataService = completerService.local(this.searchData, 'color', 'color');
  }
}
