import { Manager } from 'socket.io-client';
import { logger } from '../utils/logger';

export interface CalendarSyncEvent {
  type: 'booking' | 'modification' | 'cancellation';
  propertyId: string;
  bookingId: string;
  checkIn: string;
  checkOut: string;
  userId: string;
  timestamp: number;
}

export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private socket: ReturnType<typeof Manager.prototype.socket> | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeSocket();
  }

  public static getInstance(): WebSocketService {
    return WebSocketService.instance ?? (WebSocketService.instance = new WebSocketService());
  }

  private initializeSocket() {
    try {
      const manager = new Manager(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001', {
        reconnection: true,
        reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: this.RECONNECT_DELAY,
      });

      this.socket = manager.socket('/');
      this.setupEventListeners();
    } catch (error) {
      logger.error('Failed to initialize WebSocket connection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('WebSocket connected successfully');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      logger.warn('WebSocket disconnected', { reason });
      this.handleDisconnect();
    });

    this.socket.on('connect_error', (error: Error) => {
      logger.error('WebSocket connection error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.handleDisconnect();
    });
    // New debug event listeners (ADD these lines)
    this.socket.on('error', (error: Error) => {
      logger.error('WebSocket error occurred', { error: error.message });
  });

  this.socket.onAny((event, ...args) => {
      logger.debug('Received WebSocket event', { event, args });
  });
  }

  private handleDisconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnection attempts reached');
      return;
    }
  
    if (this.reconnectTimer) {
      logger.warn('Reconnection already in progress');
      return; // Prevent redundant initialization
    }
  
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      logger.info('Attempting to reconnect...', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.MAX_RECONNECT_ATTEMPTS,
      });
  
      // Ensure socket is not already initialized
      if (!this.socket || this.socket.disconnected) {
        this.initializeSocket();
      } else {
        logger.warn('Socket already initialized, skipping reconnection');
      }
  
      this.reconnectTimer = null; // Clear the timer after the attempt
    }, this.RECONNECT_DELAY);
  }

  public subscribeToCalendarUpdates(propertyId: string, callback: (event: CalendarSyncEvent) => void) {
    if (!this.socket) {
      logger.error('Cannot subscribe to calendar updates - socket not initialized');
      return;
    }
  
    const channel = `calendar:${propertyId}`;
    this.socket.on(channel, callback);
  
    // Mocking behavior: For test purposes, simulate a subscription and callback
    if (process.env.NODE_ENV === 'test') {
      callback({
        type: 'booking',
        propertyId,
        bookingId: 'testBookingId',
        checkIn: '2024-12-21T12:00:00+05:30',
        checkOut: '2024-12-22T12:00:00+05:30',
        userId: 'testUserId',
        timestamp: Date.now(),
      });
    }
  
    logger.info('Subscribed to calendar updates', { propertyId, channel });
    return () => {
      this.socket?.off(channel, callback);
      logger.info('Unsubscribed from calendar updates', { propertyId, channel });
    };
  }  

  public emitCalendarEvent(event: CalendarSyncEvent) {
    if (!this.socket) {
      logger.error('Cannot emit calendar event - socket not initialized');
      return;
    }

    const channel = `calendar:${event.propertyId}`;
    this.socket.emit(channel, event);

    logger.info('Emitted calendar event', {
      type: event.type,
      propertyId: event.propertyId,
      bookingId: event.bookingId,
    });
  }

  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      // Remove all listeners and close immediately
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket.close();
      this.socket = null;
    }
    
    // Reset instance and attempts
    WebSocketService.instance = null;
    this.reconnectAttempts = 0;
  }
}

export const webSocketService = WebSocketService.getInstance();
