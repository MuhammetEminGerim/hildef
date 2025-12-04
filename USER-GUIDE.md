# Kindergarten Manager Kullanım Kılavuzu

Bu doküman, Kindergarten Manager masaüstü uygulamasının temel işlevlerini nasıl kullanacağınızı açıklar.

## 1. Giriş

İlk kurulumdan sonra uygulamayı açtığınızda Dashboard ekranı açılır. Yönetici işlemleri (yedekleme, kullanıcı ekleme vb.) için giriş yapmanız önerilir.

### İlk Giriş

- Varsayılan kullanıcı adı: `admin`
- Varsayılan şifre: `admin`

Şifreyi değiştirmek için:
1. Sol menüden **Ayarlar** sayfasına gidin.
2. Giriş formundan admin hesabıyla giriş yapın.

## 2. Dashboard

Dashboard sayfasında:
- **Toplam Öğrenci** sayısını
- Geçerli ay **Toplam Gelir** ve **Toplam Gider** tutarlarını
- **Net Kâr** değerini

kartlar halinde görebilirsiniz. Veriler, öğrenciler, ödemeler ve giderler üzerinden otomatik hesaplanır.

## 3. Öğrenci Yönetimi

Sol menüden **Öğrenciler** sayfasına geçin.

### Öğrenci Ekleme

Form alanlarını doldurun:
- **Çocuk Adı**
- **Veli Adı**
- **Telefon**
- **Aylık Ücret (TL)**

Sonra **Öğrenci Ekle** butonuna basın.

### Öğrenci Düzenleme

1. Listeden ilgili öğrencinin satırında **Düzenle** butonuna tıklayın.
2. Üstteki form öğrenci bilgileriyle dolar.
3. Gerekli alanları güncelleyip **Öğrenciyi Güncelle** butonuna basın.

### Öğrenci Silme

1. İlgili satırdaki **Sil** butonuna tıklayın.
2. Onay penceresini onaylayın.

## 4. Gelir ve Ödemeler

Sol menüden **Gelir & Gider** sayfasına geçin.

### Öğrenci Ödemeleri

1. Üst bölümden bir **Öğrenci** seçin.
2. Ödeme formunda:
   - **Tutar (TL)**
   - **Vade Tarihi**
   alanlarını doldurun.
3. **Ödeme Ekle** butonuna basın.

Ödemeler alt tablodan takip edilir. Durumlar:
- **Pending**: Bekleyen ödeme
- **Paid**: Ödenmiş
- **Overdue**: Vadesi geçmiş

Bir ödemeyi ödenmiş işaretlemek için satırdaki **Ödendi** butonuna tıklayın.

## 5. Gider Yönetimi

Yine **Gelir & Gider** sayfasında, alt bölümde giderler bulunur.

### Gider Ekleme

Form alanlarını doldurun:
- **Kategori** (Kira, Yemek, Faturalar, Maaşlar, Diğer)
- **Açıklama** (opsiyonel)
- **Tutar (TL)**
- **Tarih**

Sonra **Gider Ekle** butonuna basın. Eklenen giderler tabloda listelenir.

## 6. Raporlar ve CSV Dışa Aktarım

Sol menüden **Raporlar** sayfasına geçin.

1. Üstteki **Dönem (Ay)** alanından rapor almak istediğiniz ayı seçin.
2. **Raporu Getir** butonuna tıklayın.
3. Alt kısımda seçilen ay için:
   - Gelir tablosu
   - Gider tablosu

listelenir.

CSV dosyasına aktarmak için **CSV Olarak Dışa Aktar** butonuna tıklayın ve dosyayı kaydedeceğiniz yeri seçin.

## 7. Ayarlar, Giriş ve Yedekleme

Sol menüden **Ayarlar** sayfasına geçin.

### Giriş

- Kullanıcı adı ve şifre ile giriş yapın.
- Giriş yaptıktan sonra sağ üstte aktif kullanıcı adı görünür.

### Manuel Yedek Alma

1. Ayarlar sayfasında **Manuel Yedek Al** butonuna tıklayın.
2. Dosyayı kaydetmek istediğiniz konumu seçin.
3. Uygulama mevcut veritabanı dosyasının bir kopyasını oluşturur.

### Yedek Geri Yükleme

1. **Yedek Geri Yükle** butonuna tıklayın.
2. Daha önce alınmış `.db` uzantılı yedek dosyasını seçin.
3. İşlem tamamlandığında uygulamayı yeniden başlatmanız istenebilir.

### Otomatik Yedekleme

1. **Otomatik Yedekleme** bölümünde:
   - Periyot seçin: **Kapalı**, **Günlük**, **Haftalık**
   - Bir **Yedekleme Klasörü** seçin.
2. **Ayarları Kaydet** butonuna tıklayın.

Uygulama arka planda periyodik olarak veritabanı dosyasını bu klasöre kopyalayacaktır.

## 8. İpuçları

- Yeni bir sürüme geçmeden önce mutlaka manuel yedek alın.
- Admin şifresini kimseyle paylaşmayın.
- Dashboard verileri anlık olarak veritabanından hesaplanır; veri girişi yaptıkça kartlar ve raporlar güncellenecektir.


