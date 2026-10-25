---
title: "Ubuntu'da NTP (Chrony) ile Saat Senkronizasyonu"
date: 2026-10-24
summary: "Chrony kurulumu, doğrulama ve kendi ağın için yerel NTP sunucusu kurma."
tags: ubuntu, linux, ntp, Chrony
---

## Neden saat senkronizasyonu önemli?

Sunucuların saati birbirinden saparsa log kayıtları karışır, sertifikalar hatalı görünür, Kubernetes ve veritabanı kümeleri sorun çıkarır. Bu yüzden her sunucunun saati **NTP** (Network Time Protocol) ile doğru tutulur.

Ubuntu, varsayılan olarak basit bir istemci olan `systemd-timesyncd` ile gelir. Bu yazıda daha doğru ve esnek olan **chrony** kullanıyoruz. Chrony kurulunca timesyncd otomatik olarak devre dışı kalır.

## 1. Mevcut durumu kontrol et

```bash
timedatectl
```

Çıktıdaki `System clock synchronized: yes` satırı saatin senkron olduğunu gösterir.

## 2. Chrony'yi kur

```bash
sudo apt update
sudo apt install chrony -y
sudo systemctl enable --now chrony
```

## 3. Saat dilimini ayarla

```bash
sudo timedatectl set-timezone Europe/Istanbul
```

## 4. Türkiye sunucularını ekle

Yapılandırma dosyasını aç:

```bash
sudo nano /etc/chrony/chrony.conf
```

Şu satırı ekle:

```
pool tr.pool.ntp.org iburst
```

`iburst`, başlangıçta hızlı senkronizasyon sağlar. Kaydedip çık (`Ctrl+O`, `Enter`, `Ctrl+X`) ve servisi yeniden başlat:

```bash
sudo systemctl restart chrony
```

## 5. Doğrula

```bash
chronyc tracking
chronyc sources -v
```

- `chronyc tracking` içindeki `System time` değeri saatin gerçek saatten ne kadar saptığını gösterir. Saniyenin küçük bir kesri olmalı.
- `chronyc sources -v` içinde `^*` ile başlayan satır, şu an senkron olduğun sunucudur.

Saat çok sapmışsa hemen düzeltmek için:

```bash
sudo chronyc makestep
```

## 6. Kendi ağın için NTP sunucusu yap

Ağındaki birçok cihaz internete çıkmadan saatini bir merkezden alabilir. Sunucu olacak makinede `/etc/chrony/chrony.conf` dosyasına ağını ekle:

```
allow 192.168.1.0/24
```

`192.168.1.0/24` yerine kendi ağını yaz. Sonra servisi yeniden başlat ve NTP portunu aç:

```bash
sudo systemctl restart chrony
sudo ufw allow 123/udp
```

## 7. İstemcileri bu sunucuya bağla

İstemci makinede chrony kur, yapılandırma dosyasına NTP sunucusunun IP'sini yaz:

```
server 192.168.1.10 iburst
```

Servisi yeniden başlatıp `chronyc sources -v` ile kontrol et.

## Sorun giderme

- **Senkron olmuyor:** `123/udp` portunun güvenlik duvarında açık olduğundan emin ol. NTP, TCP değil UDP kullanır.
- **`chronyc sources` boş:** Sunucunun DNS çözümleyip çözemediğini `ping tr.pool.ntp.org` ile dene.
- **İstemci sunucuya ulaşmıyor:** Sunucudaki `allow` satırında istemcinin ağı yazıyor mu?

## Sonuç

Artık sunucun saati doğru tutuyor. Bu özellikle Zabbix gibi izleme sistemlerinde önemli, çünkü grafikler ve alarmlar zaman damgasına dayanıyor.
