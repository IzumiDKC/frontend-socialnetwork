import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-farm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './farm.html',
  styleUrls: ['./farm.css']
})
export class FarmComponent implements OnInit, OnDestroy {
  farmData: any = null;
  selectedSeed: string = 'CARROT';
  private timer: any;

  // Dữ liệu cấu hình lấy từ Backend
  gameConfig: any = null; 
  plantKeys: string[] = [];

  // --- SỬA LỖI Ở ĐÂY ---
  // Khai báo trực tiếp CONFIG để HTML sử dụng (không cần import file ngoài)
  readonly CONFIG = {
    CURRENCY: '💰',
    EXP_UNIT: '⭐'
  };
  // ---------------------

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.initGameData();
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // 1. Khởi tạo: Lấy Config từ Backend trước
  initGameData() {
    this.gameService.getGameConfig().subscribe({
      next: (config) => {
        this.gameConfig = config;
        this.plantKeys = Object.keys(this.gameConfig.plants);
        
        // Map thêm icon vào dữ liệu từ Backend
        this.enrichConfigData();

        // Có config rồi mới tải nông trại
        this.loadFarm();
        
        // Chạy đồng hồ
        this.timer = setInterval(() => this.updateTimers(), 1000);
      },
      error: (err) => console.error('Lỗi tải config:', err)
    });
  }

  enrichConfigData() {
    const uiData: any = {
      'CARROT': { icon: '🥕', name: 'Cà rốt' },
      'TOMATO': { icon: '🍅', name: 'Cà chua' },
      'CORN':   { icon: '🌽', name: 'Bắp' }
    };

    this.plantKeys.forEach(key => {
      if (this.gameConfig.plants[key]) {
        this.gameConfig.plants[key] = { 
          ...this.gameConfig.plants[key], 
          ...uiData[key] 
        };
      }
    });
  }

  loadFarm() {
    this.gameService.getMyFarm().subscribe({
      next: (data) => {
        this.farmData = data;
        this.sortSlots();
        this.updateTimers();
      },
      error: (err) => console.error(err)
    });
  }

  sortSlots() {
    if (this.farmData?.slots) {
      this.farmData.slots.sort((a: any, b: any) => a.slotId - b.slotId);
    }
  }

  updateTimers() {
    if (!this.farmData || !this.gameConfig) return;
    const now = Date.now();

    this.farmData.slots.forEach((slot: any) => {
      if (slot.plantType) {
        const info = this.gameConfig.plants[slot.plantType];
        // Backend trả về 'growTime'
        const growTime = info ? info.growTime : 0; 
        const finishTime = slot.plantedAt + growTime;

        if (now >= finishTime) {
          slot.displayStatus = 'READY';
          slot.displayLabel = 'Thu hoạch!';
        } else {
          slot.displayStatus = 'GROWING';
          const secondsLeft = Math.ceil((finishTime - now) / 1000);
          
          const m = Math.floor(secondsLeft / 60);
          const s = secondsLeft % 60;
          slot.displayLabel = `${m}:${s < 10 ? '0' : ''}${s}`;
        }
      } else {
        slot.displayStatus = 'EMPTY';
      }
    });
  }

  // --- Getters hiển thị ---

  get expProgress(): number {
    if (!this.farmData || !this.gameConfig) return 0;
    const currentLvl = this.farmData.level;
    const levels = this.gameConfig.levels;
    
    const startExp = levels[currentLvl - 1] || 0;
    const nextExp = levels[currentLvl] || startExp;

    if (nextExp === startExp) return 100;
    
    const percent = ((this.farmData.exp - startExp) / (nextExp - startExp)) * 100;
    return Math.min(100, Math.max(0, percent));
  }

  get nextLevelExp(): any {
    if (!this.farmData || !this.gameConfig) return 0;
    return this.gameConfig.levels[this.farmData.level] || 'MAX';
  }

  get nextLevelReward(): number {
    if (!this.farmData || !this.gameConfig) return 0;
    return this.gameConfig.rewards[this.farmData.level] || 0;
  }

  // --- Click Events ---

  onSlotClick(slot: any) {
    if (slot.displayStatus === 'EMPTY') {
      const plantInfo = this.gameConfig.plants[this.selectedSeed];
      
      // Backend trả về 'buyPrice'
      if (this.farmData.gold < plantInfo.buyPrice) {
        alert(`Không đủ tiền! Cần ${plantInfo.buyPrice} vàng.`);
        return;
      }

      this.gameService.plantSeed(slot.slotId, this.selectedSeed).subscribe({
        next: (res) => {
          this.farmData = res;
          this.sortSlots();
          this.updateTimers();
        },
        error: (err) => alert(err.error?.message)
      });
    } else if (slot.displayStatus === 'READY') {
      this.gameService.harvest(slot.slotId).subscribe({
        next: (res) => {
          this.farmData = res;
          this.sortSlots();
          this.updateTimers();
        },
        error: (err) => alert(err.error?.message)
      });
    }
  }

  onRemovePlant(event: Event, slotId: number) {
    event.stopPropagation();
    if (confirm('Bỏ cây này sẽ mất trắng tiền vốn. Bạn chắc chứ?')) {
      this.gameService.removePlant(slotId).subscribe({
        next: (res) => {
          this.farmData = res;
          this.sortSlots();
        }
      });
    }
  }
}