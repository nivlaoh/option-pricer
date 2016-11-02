import { Routes } from '@angular/router';

import { AboutRoutes } from './about/index';
import { HomeRoutes } from './home/index';
import { PricerRoutes } from './pricer/index';

export const routes: Routes = [
  //...HomeRoutes,
  ...PricerRoutes,
  ...AboutRoutes
];
