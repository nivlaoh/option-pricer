export class PricingDetail {
	constructor(
		public Symbol: string,
		public Date: Date,
		public Open: number,
		public High: number,
		public Low: number,
		public Close: number,
		public Volume: number,
		public Adj_Close: number) {}
}
