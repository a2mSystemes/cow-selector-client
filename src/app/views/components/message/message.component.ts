// src/app/shared/components/message/message.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { timer, Subject, takeUntil } from 'rxjs';
import { MessageData, MessageConfig, MessageType } from './message.model';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit, OnDestroy {
  
  // === INPUTS ===
  @Input() data!: MessageData;
  @Input() config: MessageConfig = {};
  
  // === OUTPUTS ===
  @Output() dismissed = new EventEmitter<string>();
  @Output() closeClick = new EventEmitter<void>();
  
  // === SIGNALS ===
  private isVisible = signal(false);
  private destroy$ = new Subject<void>();
  
  // === COMPUTED ===
  readonly visible = computed(() => this.isVisible());
  
  readonly messageClasses = computed(() => {
    const classes = ['app-message', `app-message--${this.data?.type || 'info'}`];
    if (this.visible()) {
      classes.push('app-message--visible');
    }
    return classes.join(' ');
  });
  
  readonly iconClass = computed(() => {
    const iconMap: Record<MessageType, string> = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-triangle', 
      warning: 'fas fa-exclamation-circle',
      info: 'fas fa-info-circle'
    };
    return iconMap[this.data?.type || 'info'];
  });
  
  readonly shouldShowTitle = computed(() => {
    return this.config.showTitle !== false && this.data?.title;
  });
  
  readonly shouldShowIcon = computed(() => {
    return this.config.showIcon !== false;
  });
  
  readonly shouldAutoDismiss = computed(() => {
    // Les erreurs ne se ferment jamais automatiquement
    if (this.data?.type === 'error') {
      return false;
    }
    // Pour les autres types, vérifier la config
    return this.data?.autoDismiss !== false;
  });
  
  readonly dismissDuration = computed(() => {
    const defaultDurations: Record<MessageType, number> = {
      success: 5000,
      warning: 7000,
      info: 4000,
      error: 0 // Jamais auto-dismiss
    };
    
    return this.data?.duration || defaultDurations[this.data?.type || 'info'];
  });
  
  readonly isClosable = computed(() => {
    return this.data?.closable !== false;
  });
  
  // === LIFECYCLE ===
  ngOnInit(): void {
    // Animer l'entrée
    timer(50).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isVisible.set(true);
    });
    
    // Configurer l'auto-dismiss si nécessaire
    if (this.shouldAutoDismiss() && this.dismissDuration() > 0) {
      timer(this.dismissDuration()).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.dismiss();
      });
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // === METHODS ===
  dismiss(): void {
    this.isVisible.set(false);
    
    // Attendre la fin de l'animation avant d'émettre
    timer(300).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.dismissed.emit(this.data?.id);
    });
  }
  
  onCloseClick(): void {
    this.closeClick.emit();
    this.dismiss();
  }
  
  onMessageClick(): void {
    // Empêcher la fermeture automatique en cas de clic sur le message
    // Avec RxJS, on émet sur destroy$ pour annuler le timer actuel
    // puis on relance un nouveau timer si nécessaire
    if (this.shouldAutoDismiss() && this.dismissDuration() > 0) {
      // Annuler le timer actuel sans détruire le composant
      this.restartAutoDismissTimer();
    }
  }
  
  // === PRIVATE HELPERS ===
  private restartAutoDismissTimer(): void {
    // Créer un nouveau timer sans affecter les autres souscriptions
    timer(this.dismissDuration()).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.dismiss();
    });
  }
  
  // === HELPERS ===
  getMessageTypeLabel(): string {
    const labels: Record<MessageType, string> = {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Avertissement',
      info: 'Information'
    };
    return labels[this.data?.type || 'info'];
  }
}