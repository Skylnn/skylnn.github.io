---
title: "Ubuntu Server 24.04 LTS Kurulumu"
date: 2026-10-23
summary: "USB'den başlayıp ilk ayarlara kadar, adım adım Ubuntu Server kurulumu."
---

## Giriş

Ubuntu Server, sunucularda en çok kullanılan Linux dağıtımlarından biri. Bu yazıda **24.04 LTS** sürümünü sıfırdan kuruyoruz. LTS, uzun süreli destek demek, yani güvenlik güncellemelerini yıllarca alırsın.

## Gereksinimler

- En az 2 GB RAM (4 GB önerilir)
- En az 25 GB boş disk alanı
- 8 GB veya daha büyük bir USB bellek
- İnternet bağlantısı

## 1. ISO dosyasını indir

`ubuntu.com/download/server` adresinden Ubuntu Server 24.04 LTS ISO dosyasını indir.

## 2. Önyüklenebilir USB hazırla

Windows'ta **Rufus**, Linux ve macOS'ta **balenaEtcher** kullanabilirsin. ISO'yu seç, USB belleği seç, **Başlat**'a bas. Bellekteki tüm veriler silinir.

Sanal makineye (VirtualBox, VMware) kuruyorsan USB gerekmez, ISO'yu doğrudan sanal CD olarak bağla.

## 3. USB'den başlat

Bilgisayarı yeniden başlatırken boot menüsüne gir (genelde `F12`, `F2`, `Esc` veya `Del`) ve USB'yi seç.

## 4. Kurulum ekranları

Sırayla şunları seç:

1. **Language:** English (sunucularda hata mesajlarını aratmak kolay olsun diye önerilir)
2. **Keyboard:** Turkish (Q) ya da kendi klavyen
3. **Type of install:** Ubuntu Server
4. **Network:** Otomatik gelen IP (DHCP) yeterli. Sabit IP'yi sonradan da ayarlayabilirsin
5. **Proxy:** Boş bırak
6. **Mirror:** Varsayılan kalsın
7. **Storage:** `Use an entire disk` seç, LVM seçeneği açık kalsın
8. **Profile setup:** Adın, sunucu adı, kullanıcı adı ve güçlü bir parola gir
9. **Ubuntu Pro:** Skip
10. **SSH setup:** `Install OpenSSH server` kutusunu işaretle. Sunucuya uzaktan bağlanmak için şart
11. **Featured snaps:** Hiçbirini seçme

Kurulum bitince **Reboot Now**'a bas. USB'yi çıkarmayı unutma.

## 5. İlk giriş ve güncelleme

Kullanıcı adı ve parolanla giriş yap, sonra sistemi güncelle:

```bash
sudo apt update && sudo apt upgrade -y
```

## 6. Temel ayarlar

Saat dilimini ve sunucu adını ayarla:

```bash
sudo timedatectl set-timezone Europe/Istanbul
sudo hostnamectl set-hostname sunucu01
```

IP adresini öğren:

```bash
ip a
```

Güvenlik duvarını aç, ama önce SSH'a izin ver. Sırası önemli, yoksa kendi bağlantını kesersin:

```bash
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

## 7. Uzaktan bağlan

Kendi bilgisayarından terminal açıp (Windows'ta PowerShell) bağlan:

```bash
ssh kullanici@SUNUCU_IP
```

`kullanici` ve `SUNUCU_IP` yerine kendi bilgilerini yaz.

## Sonuç

Artık temiz, güncel ve uzaktan erişilebilir bir Ubuntu Server'ın var. Sonraki yazılarda bu sunucuya NTP ve Zabbix kuracağız.
