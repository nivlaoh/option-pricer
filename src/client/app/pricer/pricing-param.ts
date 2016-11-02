export class PricingParam {
	constructor(
		public symbol: string,
		public maturity: Date,
		public strikePrice: number,
		public startDate: Date,
		public endDate: Date) {}
}
