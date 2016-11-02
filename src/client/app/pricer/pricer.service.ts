import { Injectable } from '@angular/core';
import { Headers, Http, Jsonp, Response, URLSearchParams } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

import { PricingParam } from './pricing-param';
import * as moment from 'moment';

@Injectable()
export class PricerService {
	private pricingUrl = 'app/pricing';
	private yahooEndpoint = 'https://query.yahooapis.com/v1/public/yql?q=';
	private yahooEndpointFormat = '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

	constructor(private http: Http, private jsonp: Jsonp) {}

	private handleError(error: any) {
		console.error("PriceService Error", error);
		return Observable.throw(error.message || error);
	}

	getStockSymbol(symbol: string) {
		let queryHead = 'https://autoc.finance.yahoo.com/autoc';
		let search = new URLSearchParams();
		search.set('query', encodeURIComponent(symbol.toLowerCase()));
		search.set('region', '1');
		search.set('lang', 'en');
		search.set('callback', 'JSONP_CALLBACK');

		let headers = new Headers();
		headers.append("Referer", null);

		return this.jsonp.get(queryHead, { search: search, headers: headers })
			.map((res: any) => res.json())
			.catch(this.handleError);
	}

	getQuotes(symbol: string) {
		let sqlQuery = 'select * from yahoo.finance.quotes where symbol = "';
		let sqlFullQuery = sqlQuery + symbol + '"';
		let fullQuery = this.yahooEndpoint + encodeURIComponent(sqlFullQuery) + this.yahooEndpointFormat;
		console.log("full query", fullQuery);
		return this.http.get(fullQuery)
			.map((response: Response) => {
				let result = response.json().query.results.quote as any;
				console.log("check json", result);
				result.Bid = parseFloat(result.Bid);
				result.Ask = parseFloat(result.Ask);
				return result;
			})
			.catch(this.handleError);
	}

	getHistoricalPricing(param: PricingParam) {
		let sqlQuery = 'select * from yahoo.finance.historicaldata where symbol = "';
		let sqlFullQuery = sqlQuery + param.symbol +
		'" and startDate = "' + moment(param.startDate).format('YYYY-MM-DD') +
		'" and endDate = "' + moment(param.endDate).format('YYYY-MM-DD') + '"';
		let fullQuery = this.yahooEndpoint + encodeURIComponent(sqlFullQuery) + this.yahooEndpointFormat;
		console.log("full query", fullQuery);
		return this.http.get(fullQuery)
			.map((response: Response) => {
				let result = response.json().query.results.quote as Array<any>;
				result.map(r => {
					r.Adj_Close = parseFloat(r.Adj_Close);
					r.Close = parseFloat(r.Close);
					r.Date = moment(r.Date).toDate();
					r.High = parseFloat(r.High);
					r.Low = parseFloat(r.Low);
					r.Open = parseFloat(r.Open);
					r.Volume = parseInt(r.Volume);
				});
				return result;
			})
			.catch(this.handleError);
	}
}
