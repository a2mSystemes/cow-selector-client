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
  templateUrl: './status.component.html',
  styleUrls: ["./status.component.scss"]
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
        return 'Développement (Hot Reload)';
      case 'static-files':
        return 'Production (Fichiers statiques)';
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
