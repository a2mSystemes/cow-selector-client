// src/app/shared/components/message/message.model.ts

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface MessageData {
  id?: string;
  type: MessageType;
  title: string;
  message: string;
  details?: string[];
  autoDismiss?: boolean;
  duration?: number; // en millisecondes
  closable?: boolean;
}

export interface MessageConfig {
  showIcon?: boolean;
  showTitle?: boolean;
  position?: 'top' | 'bottom';
  maxWidth?: string;
}
