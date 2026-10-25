---
title: "Ubuntu 24.04'e Zabbix 7.0 LTS Kurulumu"
date: 2026-10-25
summary: "Nginx ve MySQL ile Zabbix sunucusu, web arayüzü ve ajan kurulumu."
---

## Zabbix nedir?

Zabbix, sunucuları, ağ cihazlarını ve servisleri izleyen açık kaynaklı bir izleme sistemidir. CPU, RAM, disk gibi metrikleri toplar, grafik çizer ve bir şey ters giderse alarm üretir.

Bu yazıda **Zabbix 7.0 LTS** sürümünü Ubuntu 24.04 üzerine **Nginx** ve **MySQL** ile kuruyoruz. LTS, uzun süre güvenlik ve hata düzeltmesi alan sürümdür, üretim ortamı için doğru seçimdir.

## Gereksinimler

- Ubuntu 24.04 sunucu (en az 2 CPU, 4 GB RAM önerilir)
- `sudo` yetkili bir kullanıcı
- Önceki yazıdaki gibi güncel ve saati doğru bir sistem

Önce sistemi güncelle:

```bash
sudo apt update && sudo apt upgrade -y
```

## 1. Zabbix deposunu ekle

Zabbix paketleri Ubuntu'nun kendi deposunda yok. Resmi depoyu ekliyoruz:

```bash
wget https://repo.zabbix.com/zabbix/7.0/ubuntu/pool/main/z/zabbix-release/zabbix-release_latest_7.0+ubuntu24.04_all.deb
sudo dpkg -i zabbix-release_latest_7.0+ubuntu24.04_all.deb
sudo apt update
```

Adresler zamanla değişebilir. Takılırsan `zabbix.com/download` sayfasından işletim sistemini ve sürümü seçerek güncel komutları görebilirsin.

## 2. Paketleri kur

```bash
sudo apt install -y mysql-server zabbix-server-mysql zabbix-frontend-php zabbix-nginx-conf zabbix-sql-scripts zabbix-agent2
```

Her paketin görevi:

- `zabbix-server-mysql`: izleme sunucusu
- `zabbix-frontend-php`: web arayüzü
- `zabbix-nginx-conf`: Nginx ayar dosyası
- `zabbix-sql-scripts`: veritabanı tabloları
- `zabbix-agent2`: bu sunucuyu da izlemek için ajan

## 3. Veritabanını oluştur

MySQL'e gir:

```bash
sudo mysql
```

Şu komutları sırayla çalıştır. `GUCLU_PAROLA` yerine kendi parolanı yaz:

```sql
create database zabbix character set utf8mb4 collate utf8mb4_bin;
create user zabbix@localhost identified by 'GUCLU_PAROLA';
grant all privileges on zabbix.* to zabbix@localhost;
set global log_bin_trust_function_creators = 1;
quit;
```

Başlangıç tablolarını içeri aktar. Parolayı soracak, az önce belirlediğini yaz. İşlem birkaç dakika sürebilir:

```bash
zcat /usr/share/zabbix-sql-scripts/mysql/server.sql.gz | mysql --default-character-set=utf8mb4 -uzabbix -p zabbix
```

İçe aktarma bitince geçici ayarı kapat:

```bash
sudo mysql -e "set global log_bin_trust_function_creators = 0;"
```

## 4. Sunucuya veritabanı parolasını ver

```bash
sudo nano /etc/zabbix/zabbix_server.conf
```

Şu satırı bul, başındaki `#` işaretini kaldırıp parolanı yaz:

```
DBPassword=GUCLU_PAROLA
```

## 5. Nginx ayarı

```bash
sudo nano /etc/nginx/conf.d/zabbix.conf
```

Şu iki satırın başındaki `#` işaretini kaldır ve değerleri düzenle:

```
listen 8080;
server_name sunucu01;
```

`server_name` yerine sunucunun adını ya da IP adresini yazabilirsin.

Saat dilimi için PHP ayarını da kontrol et:

```bash
sudo nano /etc/zabbix/php-fpm.conf
```

Şu satırı ara ve saat diliminin doğru olduğundan emin ol:

```
php_value[date.timezone] = Europe/Istanbul
```

## 6. Servisleri başlat

```bash
sudo systemctl restart zabbix-server zabbix-agent2 nginx php8.3-fpm
sudo systemctl enable zabbix-server zabbix-agent2 nginx php8.3-fpm
```

Hepsinin çalıştığını kontrol et:

```bash
sudo systemctl status zabbix-server zabbix-agent2 nginx php8.3-fpm
```

Her birinde `active (running)` yazmalı. Çıkmak için `q` tuşuna bas.

## 7. Güvenlik duvarı

```bash
sudo ufw allow 8080/tcp
sudo ufw allow 10051/tcp
```

`8080` web arayüzü, `10051` Zabbix sunucusuna gelen ajan bağlantıları içindir.

## 8. Web arayüzünden kurulumu bitir

Tarayıcıda `http://SUNUCU_IP:8080` adresini aç. Kurulum sihirbazı açılır:

1. Dili seç, ileri
2. Gereksinim kontrolü, hepsi `OK` olmalı
3. Veritabanı türü **MySQL**, host `localhost`, veritabanı `zabbix`, kullanıcı `zabbix`, parolanı gir
4. Sunucu adını ver, saat dilimini `Europe/Istanbul` seç
5. Özeti gözden geçir ve **Finish**'e bas

## 9. İlk giriş

Giriş bilgileri şunlar:

- Kullanıcı adı: `Admin`
- Parola: `zabbix`

**Hemen parolayı değiştir.** Bu varsayılan parola herkesçe bilinir. Sol menüden **Users → Users → Admin** yolunu izle.

## 10. Kontrol

**Monitoring → Hosts** sayfasında `Zabbix server` adlı makineyi görmelisin. Birkaç dakika sonra durumu yeşile döner ve **Latest data** sayfasında gerçek metrikler (CPU, bellek, disk) akmaya başlar.

## Sorun giderme

- **Sunucu başlamıyor:** Log dosyasına bak: `sudo tail -50 /var/log/zabbix/zabbix_server.log`. En sık neden yanlış veritabanı parolası.
- **Web sayfası açılmıyor:** `ufw`'da 8080 açık mı, Nginx çalışıyor mu kontrol et.
- **Host kırmızı:** Ajan çalışıyor mu? `sudo systemctl status zabbix-agent2`

## Sonuç

Artık çalışan bir Zabbix sunucun var. Sıradaki adım, izlemek istediğin diğer sunuculara `zabbix-agent2` kurup arayüzden **Hosts → Create host** ile eklemek.
