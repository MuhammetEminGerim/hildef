# Uygulamayı Başlatma Kılavuzu

## 🚀 Hızlı Başlatma

### Seçenek 1: Development Modu (ÖNERİLEN - En Güncel Sürüm)

Bu mod en güncel özellikleri içerir ve kod değişikliklerini anında yansıtır.

#### Adımlar:

1. **Terminal/PowerShell'i açın** ve proje klasörüne gidin:
   ```bash
   cd "C:\Users\Emin\Desktop\kreş"
   ```

2. **Bağımlılıkları kontrol edin** (ilk kez çalıştırıyorsanız):
   ```bash
   npm install
   ```

3. **Uygulamayı başlatın**:
   ```bash
   npm run dev
   ```

4. **Uygulama otomatik olarak açılacak!**

   - Vite development server başlayacak (http://localhost:5173)
   - Electron penceresi açılacak
   - Hot reload aktif olacak (kod değişiklikleri otomatik yansır)

#### Giriş Bilgileri:
- **Kullanıcı adı:** `admin`
- **Şifre:** `admin`

---

### Seçenek 2: Build Edilmiş Sürüm (Production)

Eğer daha önce build edilmiş bir sürüm varsa, onu da çalıştırabilirsiniz.

#### Yöntem A: Setup Dosyası ile (Kurulum Gerekli)

1. `release` klasörüne gidin
2. `Kindergarten Manager Setup 1.0.0.exe` dosyasına çift tıklayın
3. Kurulum sihirbazını takip edin
4. Kurulumdan sonra masaüstünden veya Başlat menüsünden açın

#### Yöntem B: Unpacked Sürüm (Kurulum Gerektirmez)

1. `release/win-unpacked` klasörüne gidin
2. `Kindergarten Manager.exe` dosyasına çift tıklayın
3. Uygulama direkt açılacak

**Not:** Bu sürüm eski olabilir. En güncel özellikler için Development modunu kullanın.

---

## 🔄 Yeni Build Oluşturma

Eğer en güncel kodu build etmek isterseniz:

### Windows için:
```bash
npm run build:win
```

Build tamamlandıktan sonra:
- `release/Kindergarten Manager Setup 1.0.0.exe` dosyası oluşacak
- `release/win-unpacked/Kindergarten Manager.exe` dosyası da kullanılabilir

---

## ⚠️ Sorun Giderme

### "npm run dev" çalışmıyor

1. **Node.js yüklü mü kontrol edin:**
   ```bash
   node --version
   npm --version
   ```
   Node.js 18+ olmalı.

2. **Bağımlılıkları yeniden yükleyin:**
   ```bash
   npm install
   ```

3. **Port 5173 kullanımda mı?**
   - Eğer başka bir uygulama 5173 portunu kullanıyorsa, onu kapatın
   - Veya `vite.config.mjs` dosyasında portu değiştirin

### Uygulama açılmıyor

1. **Build'i yeniden oluşturun:**
   ```bash
   npm run build:main
   npm run dev
   ```

2. **Console'da hata var mı kontrol edin:**
   - Development modunda DevTools otomatik açılır
   - Hataları kontrol edin

### Veritabanı hatası

- İlk çalıştırmada veritabanı otomatik oluşturulur
- Eğer hata alırsanız, `%APPDATA%/kindergarten-management` klasörünü silip tekrar deneyin

---

## 📝 Notlar

- **Development modu:** Kod değişikliklerini anında görmek için
- **Production build:** Dağıtım için hazır, optimize edilmiş sürüm
- **Veritabanı:** `%APPDATA%/kindergarten-management/kindergarten.db` konumunda saklanır
- **Loglar:** Development modunda console'da görünür

---

## 🎯 Hızlı Komutlar

```bash
# Development modunda başlat
npm run dev

# Yeni build oluştur (Windows)
npm run build:win

# Sadece main process build
npm run build:main

# Sadece renderer build
npm run build:renderer
```

---

**İyi kullanımlar! 🎉**

