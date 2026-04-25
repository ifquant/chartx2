export type TradingTicketSide = "buy" | "sell";
export type TradingTicketOrderType = "market" | "limit" | "stop";
export type TradingTicketStatus = "loading" | "ready" | "submitting" | "error";

export interface TradingTicketFieldModel {
  label: string;
  valueLabel?: string;
  placeholderLabel?: string;
  disabled?: boolean;
  errorLabel?: string;
}

export interface TradingTicketStateModel {
  status: TradingTicketStatus;
  statusLabel?: string;
  errorLabel?: string;
  submitEnabled: boolean;
}

export interface TradingTicketModel {
  title: string;
  symbol: string;
  side: TradingTicketSide;
  orderType: TradingTicketOrderType;
  quantity: TradingTicketFieldModel;
  limitPrice?: TradingTicketFieldModel;
  stopPrice?: TradingTicketFieldModel;
  accountLabel?: string;
  summaryLabel?: string;
  submitLabel: string;
  state: TradingTicketStateModel;
}

export interface TradingTicketSubmitRequest {
  symbol: string;
  side: TradingTicketSide;
  orderType: TradingTicketOrderType;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
}

export type TradingTicketSubmitResult =
  | {
      ok: true;
      ticketId: string;
      statusLabel: string;
      detailLabel?: string;
    }
  | {
      ok: false;
      errorLabel: string;
      detailLabel?: string;
    };

export interface TradingSurfaceHostAdapter {
  submitTicket(request: TradingTicketSubmitRequest): Promise<TradingTicketSubmitResult>;
}
