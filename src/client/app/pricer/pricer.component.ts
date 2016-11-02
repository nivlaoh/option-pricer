import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import * as moment from 'moment';
import { PricerService } from './pricer.service';
import { Pricing } from './pricing';
import { PricingDetail } from './pricing-detail';
import { PricingParam } from './pricing-param';
import { Highcharts } from 'angular2-highcharts/index';
import 'highcharts/modules/no-data-to-display';
require('highcharts/modules/no-data-to-display')(Highcharts);

@Component({
	moduleId: module.id,
	selector: 'pricer-component',
	templateUrl: 'pricer.component.html'
})
export class PricerComponent implements OnInit {
	form: FormGroup;
	strikePrice: number;
	d1: number;
	d2: number;
	callPrice: number;
	putPrice: number;
	callDelta: number;
	putDelta: number;
	gamma: number;
	callTheta: number;
	putTheta: number;
	vega: number;
	callRho:number;
	putRho: number;
	spotPriceRange: number[];
	callOptionPricings: number[][];
	putOptionPricings: number[][];
	spotPriceSpread: number = 10;
	currency:string = 'USD';

	option: any = {
		volatility: 0,
		impliedVolatility: 0,
		bidPrice: -1,
		askPrice: -1,
		spotPrice: -1,
		strikePrice: 0,
		interestRate: 0.05,
		standardDeviation: 0,
		days: 7
	};
	chart: HighchartsChartObject;
	deltaChart: HighchartsChartObject;
	priceChartOptions: HighchartsOptions;
	deltaChartOptions: HighchartsOptions;
	pricing: Pricing;

	constructor(fb: FormBuilder, private pricerService: PricerService) {
		this.form = fb.group({
			"strikePrice": ["", Validators.required],
			"bidPrice": [""],
			"askPrice": [""],
			"spotPrice": new FormControl({ disabled: true }),
			"interestRate": [],
			"days": ["", Validators.required],
			"symbol": ["", Validators.required],
			"volatility": new FormControl({ disabled: true }),
			"impliedVolatility": []
		});
		this.priceChartOptions = {
			title: { text: "Spot price vs Option Pricing" },
			credits: { enabled: false },
			tooltip: {
				pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y:.4f}</b><br/>'
			},
			xAxis: {
				title: {
					text: "Spot Price"
				},
				labels: {
					format: "{value:.2f}"
				}
			},
			yAxis: {
				title: {
					text: "Option Pricing"
				},
				labels: {
					format: "{value:.2f}"
				}
			},
			series: [
			]
		};
		this.deltaChartOptions = {
			title: { text: 'Delta Chart' },
			credits: { enabled: false },
			xAxis: {
				title: { text: '% change in underlying' }
			},
			yAxis: {
				title: { text: '% change in delta' }
			}
		};
	}

	ngOnInit() {
		this.spotPriceRange = [];
		this.callOptionPricings = [];
		this.putOptionPricings = [];
	}

	saveInstance(chartInstance: any) {
		this.chart = chartInstance;
	}

	saveInstance2(chartInstance: any) {
		this.deltaChart = chartInstance;
	}

	average(data: number[], unbiased?: boolean) {
		let sum = data.reduce((sum, value) => {
			return sum + value;
		}, 0);

		let avg = 0;
		if (unbiased == null || unbiased === true) {
			avg = sum / (data.length - 1);
		} else
			avg = sum / data.length;
		return avg;
	}

	standardDeviation(values: number[]): number {
		let avg = this.average(values);

		let squareDiffs = values.map((value) => {
			let diff = value - avg;
			return diff * diff;
		});
		let avgSquareDiffs = this.average(squareDiffs, true);
		let stdDev = Math.sqrt(avgSquareDiffs);
		return stdDev;
	}

	erf(x: number) {
		// save the sign of x
		var sign = (x >= 0) ? 1 : -1;
		x = Math.abs(x);

		// constants
		var a1 =  0.254829592;
		var a2 = -0.284496736;
		var a3 =  1.421413741;
		var a4 = -1.453152027;
		var a5 =  1.061405429;
		var p  =  0.3275911;

		// A&S formula 7.1.26
		var t = 1.0/(1.0 + p*x);
		var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
		return sign * y; // erf(-x) = -erf(x);
	}

	cdf(x: number, mean: number, variance: number) {
		return 0.5 * (1 + this.erf((x - mean) / (Math.sqrt(2 * variance))));
	}

	std_n_cdf(x: number) {
 		return this.cdf(x, 0, 1);
	}

	processPercentage(num: number, field: string) {
		this.option[field] = num/100;
	}

	populateSpotPriceDomain() {
		let startVal = this.option.spotPrice - this.spotPriceSpread;
		let endVal = this.option.spotPrice + this.spotPriceSpread;
		let interval = (endVal - startVal) / (2*this.spotPriceSpread);
		let assumePrice: number;
		this.spotPriceRange.length = 0;
		this.callOptionPricings.length = 0;
		this.putOptionPricings.length = 0;

		for (let i=0; i<2*this.spotPriceSpread; i++) {
			assumePrice = startVal + i*interval;
			this.spotPriceRange.push(assumePrice);
			this.callOptionPricings.push([assumePrice, this.calculatePrice(assumePrice, true)]);
			this.putOptionPricings.push([assumePrice, this.calculatePrice(assumePrice)]);
		}
		//console.log(this.spotPriceRange, this.optionPricing);
		console.log(this.chart);
		if (this.chart) {
			//this.chart.series.length = 0;
			if (this.chart.series.length>1) {
				this.chart.series[0].remove(false);
				this.chart.series[0].remove(false);
			}
			this.chart.addSeries({
				name: 'Call',
				data: this.callOptionPricings
			});
			this.chart.addSeries({
				name: 'Put',
				data: this.putOptionPricings
			}, true);
		}
	}

	calculatePrice(spotPrice: number, returnCallPrice?: boolean) {
		let timeToMature = this.option.days/365;

		this.d1 = (Math.log(spotPrice/this.option.strikePrice) +
			(this.option.interestRate + Math.pow(this.option.standardDeviation,2)/2) * timeToMature) /
			(this.option.standardDeviation * Math.sqrt(timeToMature));

		this.d2 = this.d1 - (this.option.standardDeviation * Math.sqrt(timeToMature));

		this.callPrice = spotPrice * this.std_n_cdf(this.d1) -
			(this.std_n_cdf(this.d2) * this.option.strikePrice * Math.exp(-this.option.interestRate * timeToMature));

		this.putPrice = this.std_n_cdf(-this.d2) * this.option.strikePrice * Math.exp(-this.option.interestRate * timeToMature) -
			(spotPrice * this.std_n_cdf(-this.d1));

		this.callDelta = this.std_n_cdf(this.d1);
		this.putDelta = (this.std_n_cdf(this.d1) - 1);

		this.gamma = 1 / (spotPrice * this.option.standardDeviation * Math.sqrt(timeToMature)) *
			1 / Math.sqrt(2 * Math.PI) * Math.exp(-Math.pow(this.d1,2)/2);

		this.callTheta = 1/252 * (-(spotPrice * this.option.standardDeviation / (2 * Math.sqrt(timeToMature)) *
			1/Math.sqrt(2 * Math.PI) * Math.exp(-Math.pow(this.d1,2)/2)) -
			this.option.interestRate * this.option.strikePrice * Math.exp(-this.option.interestRate * timeToMature) * this.std_n_cdf(this.d2));

		this.putTheta = 1/252 * (-(spotPrice * this.option.standardDeviation / (2 * Math.sqrt(timeToMature)) *
			1/Math.sqrt(2 * Math.PI) * Math.exp(-Math.pow(this.d1,2)/2)) +
			this.option.interestRate * this.option.strikePrice * Math.exp(-this.option.interestRate * timeToMature) * this.std_n_cdf(-this.d2));

		this.vega = 1/100 * spotPrice * Math.sqrt(timeToMature) *
			1 / Math.sqrt(2 * Math.PI) * Math.exp(-Math.pow(this.d1,2)/2);

		this.callRho = 1/100 * this.option.strikePrice * timeToMature * Math.exp(-this.option.interestRate * timeToMature) * this.std_n_cdf(this.d2);
		this.putRho = -1/100 * this.option.strikePrice * timeToMature * Math.exp(-this.option.interestRate * timeToMature) * this.std_n_cdf(-this.d2);

		//console.log(this.d1, this.d2, this.callPrice);
		if (typeof returnCallPrice !== "undefined" && returnCallPrice)
			return this.callPrice;
		else
			return this.putPrice;
	}

	calculateDelta() {
		// TODO to write delta calculation
	}

	getQuote(): void {
		let formVal = this.form.value;
		console.log(formVal);
		let maturity = moment().add(formVal.days, "days").toDate();
		let param = new PricingParam(
			formVal.symbol,
			maturity,
			formVal.strikePrice,
			moment().subtract(180, "days").toDate(),
			moment().toDate());

		this.pricerService.getStockSymbol(param.symbol)
		.subscribe((res: any) => {
			let output = res;
			console.log("test", output);
		}, error => console.error(error));
		
		Observable.forkJoin(
			this.pricerService.getQuotes(param.symbol),
			this.pricerService.getHistoricalPricing(param)
		).subscribe((res: any) => {
			let result = res[0];
			console.log(result);
			this.option.bidPrice = result.Bid;
			this.option.askPrice = result.Ask;
			this.option.spotPrice = (result.Bid + result.Ask) / 2;
			this.currency = result.Currency;

			let pricings = res[1] as PricingDetail[];
			console.log("pricings", pricings);
			let interdayReturns: number[] = [];
			pricings.forEach((pricing, index) => {
				if (index !== 0) {
					interdayReturns.push((pricing.Adj_Close / pricings[index-1].Adj_Close) - 1);
				}
			});
			//console.log("interdayreturns", interdayReturns);
			let standardDeviation = this.standardDeviation(interdayReturns);
			this.option.volatility = Math.sqrt(252)*standardDeviation;
			if (this.option.impliedVolatility == 0) {
				this.option.impliedVolatility = this.option.volatility;
			}
			this.option.standardDeviation = this.option.impliedVolatility;

			this.calculatePrice(this.option.spotPrice);
			this.populateSpotPriceDomain();


		}, (error: any) => console.error(error));
		
	}
}