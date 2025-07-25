import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';

interface HealthData {
  status: string;
  timestamp: string;
  service: string;
  environment?: string;
  angular?: string;
}

interface StatusData {
  server: HealthData | null;
  isOnline: boolean;
  lastUpdate: Date;
  error?: string;
}

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="status-container">
      <div class="status-card">
        <div class="status-icon">🎯</div>
        <h1>VMix Server Status</h1>
        <p class="subtitle">Surveillance en temps réel du serveur VMix</p>
        
        <div class="status-indicator" [class.online]="statusData.isOnline" [class.offline]="!statusData.isOnline">
          <span class="indicator-dot"></span>
          {{ statusData.isOnline ? '✅ Serveur opérationnel' : '❌ Serveur hors ligne' }}
        </div>

        @if (statusData.server) {
          <div class="info-grid">
            <div class="info-card">
              <h3>Service</h3>
              <p>{{ statusData.server.service }}</p>
            </div>
            <div class="info-card">
              <h3>Environnement</h3>
              <p>{{ statusData.server.environment || 'Production' }}</p>
            </div>
            <div class="info-card">
              <h3>Mode Angular</h3>
              <p>{{ getAngularMode() }}</p>
            </div>
            <div class="info-card">
              <h3>Status</h3>
              <p>{{ statusData.server.status }}</p>
            </div>
          </div>
        }

        @if (statusData.error) {
          <div class="error-message">
            <h3>❌ Erreur de connexion</h3>
            <p>{{ statusData.error }}</p>
          </div>
        }

        <div class="actions">
          <button class="btn-primary" (click)="refreshStatus()">
            🔄 Actualiser
          </button>
          <button class="btn-secondary" (click)="toggleAutoRefresh()">
            {{ autoRefresh ? '⏸️ Arrêter' : '▶️ Démarrer' }} Auto-refresh
          </button>
        </div>

        <div class="timestamp">
          <p>Dernière mise à jour : {{ statusData.lastUpdate | date:'dd/MM/yyyy HH:mm:ss' }}</p>
          @if (autoRefresh) {
            <p class="auto-refresh-indicator">
              🔄 Actualisation automatique activée ({{ countdown }}s)
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .status-card {
      background: white;
      padding: 3rem;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 700px;
      width: 100%;
      animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .status-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    h1 {
      color: #333;
      margin-bottom: 1rem;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .subtitle {
      color: #666;
      font-size: 1.2rem;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .status-indicator {
      padding: 1rem 2rem;
      border-radius: 10px;
      margin-bottom: 2rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .status-indicator.online {
      background: #e8f5e8;
      color: #2d5a27;
      border-left: 4px solid #4caf50;
    }

    .status-indicator.offline {
      background: #fde8e8;
      color: #721c24;
      border-left: 4px solid #f44336;
    }

    .indicator-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .online .indicator-dot {
      background: #4caf50;
    }

    .offline .indicator-dot {
      background: #f44336;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .info-card {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 10px;
      border: 1px solid #e9ecef;
    }

    .info-card h3 {
      color: #495057;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .info-card p {
      color: #333;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .error-message {
      background: #fde8e8;
      color: #721c24;
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 2rem;
    }

    .error-message h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
    }

    .error-message p {
      margin: 0;
      font-size: 0.9rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a6fd8;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
      transform: translateY(-2px);
    }

    .timestamp {
      color: #888;
      font-size: 0.9rem;
      border-top: 1px solid #eee;
      padding-top: 2rem;
    }

    .timestamp p {
      margin: 0.5rem 0;
    }

    .auto-refresh-indicator {
      color: #667eea;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .status-card {
        padding: 2rem;
        margin: 1rem;
      }
      
      h1 {
        font-size: 2rem;
      }
      
      .info-grid {
        grid-template-columns: 1fr;
      }

      .actions {
        flex-direction: column;
        align-items: center;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
        max-width: 200px;
      }
    }
  `]
})
export class StatusComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  
  statusData: StatusData = {
    server: null,
    isOnline: false,
    lastUpdate: new Date()
  };

  autoRefresh = true;
  countdown = 10;
  
  private refreshSubscription?: Subscription;
  private countdownSubscription?: Subscription;

  ngOnInit() {
    this.refreshStatus();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  refreshStatus() {
    this.apiService.healthCheck()
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération du statut:', error);
          return of(null);
        })
      )
      .subscribe(data => {
        this.statusData = {
          server: data,
          isOnline: data !== null && data.status === 'OK',
          lastUpdate: new Date(),
          error: data === null ? 'Impossible de se connecter au serveur' : undefined
        };
      });
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  getAngularMode(): string {
    if (!this.statusData.server?.angular) {
      return 'Production';
    }
    
    switch (this.statusData.server.angular) {
      case 'dev-server':
        return '🔧 Développement (Hot Reload)';
      case 'static-files':
        return '📦 Production (Fichiers statiques)';
      default:
        return this.statusData.server.angular;
    }
  }

  private startAutoRefresh() {
    this.countdown = 10;
    
    // Démarrer le compte à rebours
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        this.refreshStatus();
        this.countdown = 10;
      }
    });
  }

  private stopAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }
}
