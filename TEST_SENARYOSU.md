# Kreş Yönetim Uygulaması - Test Senaryosu

## Test Öncesi Hazırlık

1. Uygulamayı başlatın: `npm run dev`
2. Varsayılan giriş bilgileri:
   - Kullanıcı adı: `admin`
   - Şifre: `admin`

---

## 1. Giriş ve Temel Kontroller

### 1.1 Giriş Yapma
- [ ] Uygulama açıldığında giriş ekranı görünüyor mu?
- [ ] `admin` / `admin` ile giriş yapılabiliyor mu?
- [ ] Giriş sonrası Dashboard'a yönlendiriliyor mu?

### 1.2 Dashboard Kontrolü
- [ ] Dashboard sayfası açılıyor mu?
- [ ] Toplam Öğrenci sayısı görünüyor mu?
- [ ] Aylık Gelir kartı görünüyor mu?
- [ ] Aylık Gider kartı görünüyor mu?
- [ ] Net Kâr kartı görünüyor mu?
- [ ] Grafik görünüyor mu? (veri yoksa boş olabilir)

### 1.3 Navigasyon
- [ ] Sol menüden tüm sayfalara geçiş yapılabiliyor mu?
  - Dashboard
  - Öğrenciler
  - Gelir & Gider
  - Raporlar
  - Ayarlar
- [ ] Sayfa geçişlerinde hata oluşmuyor mu?

### 1.4 Dark Mode
- [ ] Sağ üstte tema değiştirme butonu var mı?
- [ ] Dark/Light mode geçişi çalışıyor mu?
- [ ] Tema tercihi kaydediliyor mu? (sayfayı yenileyince korunuyor mu?)

---

## 2. Öğrenci Yönetimi (Faz 2 - Temel Bilgiler)

### 2.1 Yeni Öğrenci Ekleme
- [ ] "Yeni Öğrenci" butonu çalışıyor mu?
- [ ] Öğrenci ekleme formu açılıyor mu?
- [ ] Zorunlu alanlar kontrol ediliyor mu? (Çocuk Adı, Veli Adı, Telefon, Aylık Ücret)
- [ ] Öğrenci başarıyla ekleniyor mu?
- [ ] Başarı mesajı gösteriliyor mu?
- [ ] Liste güncelleniyor mu?

**Test Verisi:**
```
Çocuk Adı: Ahmet Yılmaz
Doğum Tarihi: 2020-05-15
Cinsiyet: Erkek
TC Kimlik No: (opsiyonel)
Kan Grubu: A+
Doğum Yeri: İstanbul
Veli Adı: Mehmet Yılmaz
Telefon: 05551234567
Acil İletişim: 05559876543
Kayıt Tarihi: (bugünün tarihi)
Aylık Ücret: 2500
Durum: Aktif
```

### 2.2 Öğrenci Listesi
- [ ] Eklenen öğrenci listede görünüyor mu?
- [ ] Öğrenci bilgileri doğru görünüyor mu?
- [ ] Durum (Aktif/Pasif) doğru gösteriliyor mu?

### 2.3 Öğrenci Düzenleme
- [ ] Öğrenci üzerinde "Düzenle" butonu çalışıyor mu?
- [ ] Form mevcut verilerle dolu geliyor mu?
- [ ] Bilgiler güncellenebiliyor mu?
- [ ] Güncelleme başarılı oluyor mu?

### 2.4 Öğrenci Silme
- [ ] "Sil" butonu çalışıyor mu?
- [ ] Silme onayı isteniyor mu?
- [ ] Öğrenci listeden kaldırılıyor mu?

### 2.5 Arama ve Filtreleme
- [ ] Arama kutusu çalışıyor mu?
- [ ] Öğrenci adı ile arama yapılabiliyor mu?
- [ ] Veli adı ile arama yapılabiliyor mu?
- [ ] Telefon ile arama yapılabiliyor mu?
- [ ] Durum filtresi çalışıyor mu? (Aktif, Mezun, Nakil, Askıya Alındı)

---

## 3. Öğrenci Yönetimi (Faz 2 - Gelişmiş Özellikler)

### 3.1 Fotoğraf Yükleme
- [ ] Öğrenci düzenleme ekranında "Temel Bilgiler" tab'ı açılıyor mu?
- [ ] Fotoğraf yükleme alanı görünüyor mu?
- [ ] Fotoğraf seçilebiliyor mu? (JPG, PNG, GIF)
- [ ] Fotoğraf önizlemesi gösteriliyor mu?
- [ ] Fotoğraf kaydediliyor mu?
- [ ] Öğrenci listesinde fotoğraf görünüyor mu?

### 3.2 Veli Bilgileri Tab'ı
- [ ] "Veli Bilgileri" tab'ına geçiş yapılabiliyor mu?
- [ ] "Veli Ekle" butonu çalışıyor mu?
- [ ] Yeni veli formu açılıyor mu?
- [ ] Veli bilgileri kaydedilebiliyor mu?
  - Ad Soyad
  - İlişki (Anne/Baba/Vasi)
  - Telefon
  - E-posta
- [ ] Birden fazla veli eklenebiliyor mu?
- [ ] "Birincil Yap" butonu çalışıyor mu?
- [ ] Veli silinebiliyor mu?

**Test Verisi:**
```
Veli 1:
- Ad: Mehmet Yılmaz
- İlişki: Baba
- Telefon: 05551234567
- E-posta: mehmet@example.com

Veli 2:
- Ad: Ayşe Yılmaz
- İlişki: Anne
- Telefon: 05559876543
- E-posta: ayse@example.com
```

### 3.3 Sağlık Bilgileri Tab'ı
- [ ] "Sağlık" tab'ına geçiş yapılabiliyor mu?
- [ ] Sağlık bilgileri formu görünüyor mu?
- [ ] Bilgiler kaydedilebiliyor mu?
  - Kronik Hastalıklar
  - Alerjiler
  - Kullanılan İlaçlar
  - Doktor Adı
  - Doktor Telefonu
  - Sigorta Bilgileri
  - Notlar
- [ ] "Sağlık Bilgilerini Kaydet" butonu çalışıyor mu?
- [ ] Kaydedilen bilgiler tekrar açıldığında görünüyor mu?

**Test Verisi:**
```
Kronik Hastalıklar: Yok
Alerjiler: Fındık, Çilek
Kullanılan İlaçlar: Yok
Doktor Adı: Dr. Ali Demir
Doktor Telefonu: 02121234567
Sigorta Bilgileri: SGK - 12345678901
Notlar: Düzenli kontroller yapılıyor
```

### 3.4 Aşı Kayıtları Tab'ı
- [ ] "Aşılar" tab'ına geçiş yapılabiliyor mu?
- [ ] "Aşı Ekle" butonu çalışıyor mu?
- [ ] Aşı formu açılıyor mu?
- [ ] Aşı kaydı eklenebiliyor mu?
  - Aşı Adı
  - Aşı Tarihi
  - Sonraki Doz Tarihi
  - Notlar
- [ ] Birden fazla aşı kaydı eklenebiliyor mu?
- [ ] Aşı kaydı güncellenebiliyor mu?
- [ ] Aşı kaydı silinebiliyor mu?

**Test Verisi:**
```
Aşı 1:
- Aşı Adı: KKK (Kızamık, Kızamıkçık, Kabakulak)
- Aşı Tarihi: 2023-01-15
- Sonraki Doz: (boş)
- Notlar: Normal reaksiyon

Aşı 2:
- Aşı Adı: Hepatit B
- Aşı Tarihi: 2023-02-20
- Sonraki Doz: 2023-08-20
- Notlar: İkinci doz
```

### 3.5 Dosyalar Tab'ı
- [ ] "Dosyalar" tab'ına geçiş yapılabiliyor mu?
- [ ] "Dosya Yükle" butonu çalışıyor mu?
- [ ] Dosya seçilebiliyor mu? (PDF, resim, vb.)
- [ ] Dosya yükleniyor mu?
- [ ] Yüklenen dosya listede görünüyor mu?
- [ ] Dosya adı ve türü doğru gösteriliyor mu?
- [ ] "Aç" butonu çalışıyor mu?
- [ ] Dosya silinebiliyor mu?

**Test Dosyaları:**
- Sağlık raporu (PDF)
- Kimlik belgesi (PDF veya resim)
- Sözleşme (PDF)

---

## 4. Gelir & Gider Yönetimi

### 4.1 Ödeme Ekleme
- [ ] Gelir & Gider sayfası açılıyor mu?
- [ ] Öğrenci seçilebiliyor mu?
- [ ] Ödeme eklenebiliyor mu?
  - Tutar
  - Vade Tarihi
  - Durum (Ödendi/Beklemede/Gecikmiş)
  - Not
- [ ] Ödeme başarıyla kaydediliyor mu?

**Test Verisi:**
```
Öğrenci: Ahmet Yılmaz
Tutar: 2500 TL
Vade Tarihi: 2024-02-01
Durum: Beklemede
Not: Ocak ayı ödemesi
```

### 4.2 Ödeme Durumu Güncelleme
- [ ] Ödeme durumu güncellenebiliyor mu?
- [ ] "Ödendi" olarak işaretlenebiliyor mu?
- [ ] Ödeme tarihi girilebiliyor mu?

### 4.3 Gider Ekleme
- [ ] Gider eklenebiliyor mu?
  - Kategori (Kira, Yemek, Maaş, Diğer)
  - Açıklama
  - Tutar
  - Tarih
- [ ] Gider kaydediliyor mu?
- [ ] Gider listesi görünüyor mu?

**Test Verisi:**
```
Kategori: Kira
Açıklama: Şubat ayı kirası
Tutar: 5000 TL
Tarih: 2024-02-01
```

### 4.4 Ödeme ve Gider Düzenleme/Silme
- [ ] Ödeme düzenlenebiliyor mu?
- [ ] Ödeme silinebiliyor mu?
- [ ] Gider düzenlenebiliyor mu?
- [ ] Gider silinebiliyor mu?

---

## 5. Raporlar

### 5.1 Aylık Finansal Rapor
- [ ] Raporlar sayfası açılıyor mu?
- [ ] Ay seçilebiliyor mu?
- [ ] Rapor oluşturulabiliyor mu?
- [ ] Gelir ve gider toplamları doğru görünüyor mu?
- [ ] CSV export çalışıyor mu?
- [ ] CSV dosyası indiriliyor mu?

---

## 6. Ayarlar

### 6.1 Kullanıcı Yönetimi
- [ ] Ayarlar sayfası açılıyor mu?
- [ ] Yeni kullanıcı eklenebiliyor mu?
- [ ] Şifre değiştirilebiliyor mu?

### 6.2 Yedekleme
- [ ] Manuel yedekleme yapılabiliyor mu?
- [ ] Yedek dosyası oluşturuluyor mu?
- [ ] Yedek geri yüklenebiliyor mu?

---

## 7. Genel Kontroller

### 7.1 Hata Yönetimi
- [ ] Hatalı girişlerde uyarı mesajı gösteriliyor mu?
- [ ] Zorunlu alanlar boş bırakıldığında uyarı veriliyor mu?
- [ ] Hata durumlarında uygulama çöküyor mu?

### 7.2 Performans
- [ ] Sayfa geçişleri hızlı mı?
- [ ] Liste yüklemeleri hızlı mı?
- [ ] Uygulama donuyor mu?

### 7.3 Klavye Kısayolları
- [ ] Alt+D: Dashboard'a git
- [ ] Alt+S: Öğrenciler sayfasına git
- [ ] Alt+F: Gelir & Gider sayfasına git
- [ ] Alt+R: Raporlar sayfasına git
- [ ] Alt+A: Ayarlar sayfasına git

---

## 8. Faz 3 Özellikleri (Altyapı Hazır - UI Henüz Yok)

**Not:** Faz 3'ün altyapısı hazır ancak UI henüz eklenmedi. Bu özellikler şu an test edilemez:
- Taksit planları oluşturma
- Otomatik hatırlatmalar
- İndirim uygulama
- Kısmi ödeme
- Gelişmiş makbuz sistemi

Bu özellikler için UI geliştirildikten sonra test edilecek.

---

## Test Sonuçları

### Başarılı Testler
- [ ] Test 1: ...
- [ ] Test 2: ...

### Hatalı Testler
- [ ] Test X: Hata açıklaması...
- [ ] Test Y: Hata açıklaması...

### Öneriler
- ...

---

## Test Notları

- Test tarihi: _______________
- Test eden: _______________
- Uygulama versiyonu: _______________
- İşletim sistemi: _______________

---

## Hata Raporlama Formatı

Bir hata bulduğunuzda lütfen şu bilgileri not edin:

1. **Hata Açıklaması:** Ne oldu?
2. **Beklenen Davranış:** Ne olması gerekiyordu?
3. **Gerçekleşen Davranış:** Ne oldu?
4. **Adımlar:** Hatayı tekrarlamak için adımlar
5. **Ekran Görüntüsü:** Varsa ekran görüntüsü
6. **Öncelik:** Düşük / Orta / Yüksek / Kritik

---

## Hızlı Test Checklist

Eğer zamanınız kısıtlıysa, en önemli özellikleri test edin:

- [ ] Giriş yapma
- [ ] Yeni öğrenci ekleme
- [ ] Öğrenci düzenleme (temel bilgiler)
- [ ] Veli ekleme
- [ ] Sağlık bilgileri kaydetme
- [ ] Aşı kaydı ekleme
- [ ] Dosya yükleme
- [ ] Ödeme ekleme
- [ ] Gider ekleme
- [ ] Rapor oluşturma
- [ ] Dark mode geçişi

---

**İyi testler! 🧪**

