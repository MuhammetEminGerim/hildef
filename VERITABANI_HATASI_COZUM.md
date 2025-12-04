# Veritabanı Hatası Çözümü

## ❌ Hata
```
SqliteError: table students has no column named gender
```

## ✅ Çözüm

Migration sistemi eklendi! Artık uygulama açıldığında otomatik olarak eksik kolonları ekleyecek.

### Yapılan Değişiklikler

1. **Migration sistemi eklendi** (`electron/db/migrations.ts`)
   - Mevcut veritabanındaki eksik kolonları otomatik tespit eder
   - Eksik kolonları ekler
   - Verilerinizi korur

2. **Connection.ts güncellendi**
   - Her açılışta migration'ları çalıştırır
   - Eksik kolonları otomatik ekler

### Eklenecek Kolonlar

- `gender` (Cinsiyet)
- `tc_identity_no` (TC Kimlik No)
- `blood_type` (Kan Grubu)
- `birth_place` (Doğum Yeri)
- `graduation_date` (Mezuniyet Tarihi)
- `status` (Durum)
- `tags` (Etiketler)
- `notes` (Notlar - zaten varsa eklenmez)
- `allergies` (Alerjiler)
- `medical_conditions` (Tıbbi Durumlar)

## 🚀 Şimdi Yapmanız Gerekenler

1. **Uygulamayı tamamen kapatın**
   - Tüm Electron pencerelerini kapatın
   - Terminal'de `Ctrl+C` ile durdurun

2. **Uygulamayı yeniden başlatın:**
   ```bash
   npm run dev
   ```

3. **Console'u kontrol edin:**
   - Terminal'de migration mesajlarını göreceksiniz:
     ```
     Added gender column to students table
     Added tc_identity_no column to students table
     ...
     Migrations completed successfully
     ```

4. **Öğrenci eklemeyi tekrar deneyin**
   - Artık hata olmamalı
   - Tüm yeni alanlar çalışmalı

## ⚠️ Alternatif Çözüm (Eğer Migration Çalışmazsa)

Eğer migration çalışmazsa, veritabanını sıfırlayabilirsiniz:

1. **Veritabanı dosyasını bulun:**
   - Windows: `%APPDATA%/kindergarten-management/kindergarten.db`
   - Veya: `C:\Users\Emin\AppData\Roaming\kindergarten-management\kindergarten.db`

2. **Dosyayı yedekleyin** (önemli veriler varsa):
   ```bash
   copy "C:\Users\Emin\AppData\Roaming\kindergarten-management\kindergarten.db" "C:\Users\Emin\AppData\Roaming\kindergarten-management\kindergarten.db.backup"
   ```

3. **Dosyayı silin:**
   - Uygulamayı kapatın
   - `kindergarten.db` dosyasını silin
   - Uygulamayı yeniden açın (yeni şema ile oluşturulacak)

## 📋 Kontrol Listesi

- [ ] Uygulama kapatıldı
- [ ] `npm run dev` ile yeniden başlatıldı
- [ ] Console'da migration mesajları görüldü
- [ ] Öğrenci ekleme denendi
- [ ] Hata olmadı

---

**Not:** Migration sistemi sayesinde gelecekte şema değişikliklerinde de otomatik güncelleme yapılacak!

