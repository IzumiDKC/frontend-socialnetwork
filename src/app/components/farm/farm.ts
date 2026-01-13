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
  selectedSeed: string = ''; 
  private timer: any;

  gameConfig: any = null; 
  plantKeys: string[] = [];
  
  // Biến điều khiển bật/tắt Shop
  isShopOpen: boolean = false;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.initGameData();
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  toggleShop() {
    this.isShopOpen = !this.isShopOpen;
  }

  selectSeed(key: string) {
    const plant = this.gameConfig.plants[key];
    // Kiểm tra level xem có đủ trình độ để chọn không
    if (this.farmData.level < plant.unlockLevel) {
      alert(`Bạn cần đạt Level ${plant.unlockLevel} để trồng cây này!`);
      return;
    }
    this.selectedSeed = key;
    this.isShopOpen = false; // Chọn xong thì đóng shop
  }

  initGameData() {
    this.gameService.getGameConfig().subscribe({
      next: (config) => {
        this.gameConfig = config;
        this.plantKeys = Object.keys(this.gameConfig.plants);
        
        // Mặc định chọn hạt giống đầu tiên (nếu có và đủ level)
        // Logic chọn hạt mặc định có thể tùy chỉnh sau
        if (this.plantKeys.length > 0) {
            this.selectedSeed = this.plantKeys[0];
        }

        this.enrichConfigData();
        this.loadFarm();
        this.timer = setInterval(() => this.updateTimers(), 1000);
      },
      error: (err) => console.error('Lỗi tải config:', err)
    });
  }

  enrichConfigData() {
    this.plantKeys.forEach(key => {
      const plant = this.gameConfig.plants[key];
      if (plant) {
        plant.displayName = key; 
        
        // --- QUAN TRỌNG: ĐƯỜNG DẪN ẢNH ---
        // key: Tên Folder (từ DB, ví dụ "Beet")
        // key.toLowerCase(): Tên file (ví dụ "beet")
        // Đường dẫn: assets/game/plants/Beet/beet_5.png
        plant.shopIcon = `assets/game/plants/${key}/${key.toLowerCase()}_${plant.totalStages}.png`;
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
        
        if (!info) {
            slot.displayStatus = 'ERROR'; 
            return;
        }

        const growTime = info.growTime; 
        const finishTime = slot.plantedAt + growTime;
        const timeElapsed = now - slot.plantedAt;
        const totalStages = info.totalStages || 1;

        let currentStage = 1;

        if (timeElapsed >= growTime) {
          currentStage = totalStages;
          slot.displayStatus = 'READY';
          slot.displayLabel = 'Thu hoạch!';
        } else {
          slot.displayStatus = 'GROWING';
          if (totalStages > 1) {
              const stageDuration = growTime / (totalStages - 1);
              const stageCalc = 1 + Math.floor(timeElapsed / stageDuration);
              currentStage = Math.min(stageCalc, totalStages - 1);
          }

          const secondsLeft = Math.ceil((finishTime - now) / 1000);
          const m = Math.floor(secondsLeft / 60);
          const s = secondsLeft % 60;
          slot.displayLabel = `${m}:${s < 10 ? '0' : ''}${s}`;
        }

        // --- QUAN TRỌNG: ĐƯỜNG DẪN ẢNH TRÊN CÂY ---
        // assets/game/plants/Beet/beet_1.png
        slot.currentImage = `assets/game/plants/${slot.plantType}/${slot.plantType.toLowerCase()}_${currentStage}.png`;

      } else {
        slot.displayStatus = 'EMPTY';
        slot.currentImage = null;
      }
    });
  }

  // ... (Giữ nguyên các Getter cloudFloors, expProgress...)
  get cloudFloors() {
    if (!this.farmData || !this.farmData.slots) return [];
    const chunkSize = 6; 
    const floors = [];
    for (let i = 0; i < this.farmData.slots.length; i += chunkSize) {
      floors.push(this.farmData.slots.slice(i, i + chunkSize));
    }
    return floors;
  }

  get expProgress(): number {
    if (!this.farmData || !this.gameConfig) return 0;
    const currentLvl = this.farmData.level;
    const levels = this.gameConfig.levels;
    const startExp = levels[currentLvl - 1] || 0;
    const nextExp = levels[currentLvl] || startExp;
    if (nextExp === startExp) return 100;
    return Math.min(100, Math.max(0, ((this.farmData.exp - startExp) / (nextExp - startExp)) * 100));
  }

  get nextLevelExp(): any {
    if (!this.farmData || !this.gameConfig) return 0;
    return this.gameConfig.levels[this.farmData.level] || 'MAX';
  }

  // --- EVENTS ---

  onSlotClick(slot: any) {
    if (slot.displayStatus === 'EMPTY') {
      
      // Nếu chưa chọn hạt giống
      if (!this.selectedSeed) {
        this.isShopOpen = true; // Mở shop bắt người dùng chọn
        return;
      }

      const plantInfo = this.gameConfig.plants[this.selectedSeed];
      if (!plantInfo) return;

      // Check tiền
      if (this.farmData.gold < plantInfo.buyPrice) {
        alert(`Không đủ tiền! Cần ${plantInfo.buyPrice} vàng.`);
        return;
      }
      
      // Check lại level lần nữa (backend cũng nên check)
      if (this.farmData.level < plantInfo.unlockLevel) {
         alert(`Level chưa đủ!`);
         return;
      }

      this.gameService.plantSeed(slot.slotId, this.selectedSeed).subscribe({
        next: (res) => {
          this.farmData = res;
          this.sortSlots();
          this.updateTimers();
        },
        error: (err) => alert(err.error?.message || 'Lỗi kết nối')
      });
    } else if (slot.displayStatus === 'READY') {
      this.gameService.harvest(slot.slotId).subscribe({
        next: (res) => {
          this.farmData = res;
          this.sortSlots();
          this.updateTimers();
        },
        error: (err) => alert(err.error?.message || 'Lỗi kết nối')
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